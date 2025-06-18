from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from ..services import WallBallAnalyzer, RepTracker
from ..models import Pose, Point3D, BallPosition
import json
import numpy as np
import cv2

router = APIRouter()

# Store active connections
connections = {}
sessions = {}

@router.websocket("/ws/session/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    await websocket.accept()
    
    # Initialize with caching
    analyzer = WallBallAnalyzer()
    tracker = RepTracker(analyzer)
    frame_cache = {}  # Cache for frame processing
    
    connections[session_id] = websocket
    sessions[session_id] = {
        "analyzer": analyzer,
        "tracker": tracker,
        "frame_cache": frame_cache
    }
    
    try:
        while True:
            data = await websocket.receive_json()
            
            if data["type"] == "pose":
                # Frame skipping (only if frame_id is present)
                frame_id = data["data"].get("frame_id")
                if frame_id is not None and frame_id % 3 != 0:  # Process every 3rd frame
                    continue
                
                # Process pose data with caching
                if frame_id is not None and frame_id in frame_cache:
                    result = frame_cache[frame_id]
                else:
                    # Process landmarks
                    landmarks = [Point3D(**lm) for lm in data["data"]["landmarks"]]
                    
                    # Process ball detection if frame data is available
                    ball_position = None
                    if "frame" in data["data"]:
                        frame = np.array(data["data"]["frame"])
                        ball_detection = analyzer.detect_ball(frame)
                        if ball_detection:
                            ball_position = ball_detection
                    
                    pose = Pose(
                        landmarks=landmarks,
                        timestamp=data["data"]["timestamp"]
                    )
                    
                    # Get image height for calculations
                    image_height = data["data"].get("image_height", 720)
                    
                    # Update tracker with pose and ball position
                    result = tracker.update(pose, image_height, ball_position)
                    
                    if frame_id is not None:
                        frame_cache[frame_id] = result
                
                # Clean up old cache entries
                if len(frame_cache) > 30:  # Keep last 30 frames
                    frame_cache.pop(min(frame_cache.keys()))
                
                # Send response with all relevant data
                await websocket.send_json({
                    "type": "analysis",
                    "data": {
                        "phase": result["phase"],
                        "angle": result.get("knee_angle"),
                        "stats": result["stats"],
                        "state": result.get("state_machine", {}).get("state"),
                        "feedback": result.get("state_machine", {}).get("feedback", []),
                        "confidence": result.get("state_machine", {}).get("form_validation", {}).get("confidence"),
                        "ball_detected": result.get("ball_position") is not None,
                        "ball_height": result.get("ball_position", [0, 0, 0])[1] if result.get("ball_position") else None,
                        "knee_angle": result.get("state_machine", {}).get("angles", {}).get("knee"),
                        "hip_angle": result.get("state_machine", {}).get("angles", {}).get("hip"),
                        "ankle_angle": result.get("state_machine", {}).get("angles", {}).get("ankle"),
                        "side": result.get("state_machine", {}).get("selected_side"),
                        "rep_count": result.get("state_machine", {}).get("squat_count"),
                        "rep_valid": result.get("rep_completed", False),
                        "rep_errors": result.get("state_machine", {}).get("form_validation", {}).get("errors", [])
                    }
                })
                
    except WebSocketDisconnect:
        connections.pop(session_id, None)
        sessions.pop(session_id, None)