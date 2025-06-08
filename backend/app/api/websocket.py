from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from ..services import WallBallAnalyzer, RepTracker
from ..models import Pose, Point3D
import json

router = APIRouter()

# Store active connections
connections = {}
sessions = {}

@router.websocket("/ws/session/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    await websocket.accept()
    
    # Initialize analyzer and tracker
    analyzer = WallBallAnalyzer()
    tracker = RepTracker(analyzer)
    
    connections[session_id] = websocket
    sessions[session_id] = {
        "analyzer": analyzer,
        "tracker": tracker,
        "stats": {
            "total_reps": 0,
            "valid_reps": 0,
            "invalid_reps": 0
        }
    }
    
    try:
        while True:
            # Receive data
            data = await websocket.receive_json()
            
            if data["type"] == "pose":
                # Process pose data
                landmarks = [Point3D(**lm) for lm in data["data"]["landmarks"]]
                pose = Pose(landmarks=landmarks, timestamp=data["data"]["timestamp"])
                
                # Update tracker
                result = tracker.update(pose)
                
                # Update stats if rep completed
                if result["rep_completed"]:
                    sessions[session_id]["stats"]["total_reps"] += 1
                    if result["rep_data"]["valid"]:
                        sessions[session_id]["stats"]["valid_reps"] += 1
                    else:
                        sessions[session_id]["stats"]["invalid_reps"] += 1
                
                # Send response
                await websocket.send_json({
                    "type": "analysis",
                    "data": {
                        "phase": result["phase"],
                        "angle": result["angle"],
                        "stats": sessions[session_id]["stats"]
                    }
                })
                
    except WebSocketDisconnect:
        del connections[session_id]
        del sessions[session_id]