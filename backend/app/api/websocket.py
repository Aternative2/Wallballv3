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
        "stats": tracker.stats  # Use the new stats structure
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
                
                # No need to update stats here, tracker.stats is always up to date
                
                # Send response
                await websocket.send_json({
                    "type": "analysis",
                    "data": {
                        "phase": result["phase"],
                        "angle": result.get("angle", result.get("knee_angle")),
                        "stats": tracker.stats
                    }
                })
                
    except WebSocketDisconnect:
        del connections[session_id]
        del sessions[session_id]