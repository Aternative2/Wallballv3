from typing import Dict, Any, Optional
from datetime import datetime
from ..models import Pose
from .analyzer import WallBallAnalyzer

class RepTracker:
    """Tracks repetitions and validates form"""
    def __init__(self, analyzer: WallBallAnalyzer):
        self.analyzer = analyzer
        self.phase = "READY"
        self.current_rep = None
        self.previous_pose = None
        self.rep_history = []
        
    def update(self, pose: Pose) -> Dict[str, Any]:
        """Update tracker with new pose data"""
        angle = self.analyzer.calculate_thigh_angle(pose)
        movement = self.analyzer.detect_movement_phase(pose, self.previous_pose)
        
        result = {
            "phase": self.phase,
            "angle": angle,
            "movement": movement,
            "rep_completed": False,
            "rep_data": None
        }
        
        # State machine for rep tracking
        if self.phase == "READY" and movement == "DESCENDING" and angle and angle < 45:
            self.phase = "DESCENDING"
            self.current_rep = {
                "start_time": datetime.now(),
                "max_depth": angle,
                "valid_squat": False,
                "errors": []
            }
            
        elif self.phase == "DESCENDING":
            if angle and angle > self.current_rep["max_depth"]:
                self.current_rep["max_depth"] = angle
            
            if angle and self.analyzer.is_squat_valid(angle):
                self.current_rep["valid_squat"] = True
            
            if movement == "ASCENDING":
                self.phase = "ASCENDING"
                if not self.current_rep["valid_squat"]:
                    self.current_rep["errors"].append("INSUFFICIENT_DEPTH")
                    
        elif self.phase == "ASCENDING" and angle and angle < 30:
            # Complete rep
            self.phase = "READY"
            
            rep_data = {
                "rep_number": len(self.rep_history) + 1,
                "valid": self.current_rep["valid_squat"],
                "max_depth": self.current_rep["max_depth"],
                "duration": (datetime.now() - self.current_rep["start_time"]).total_seconds(),
                "errors": self.current_rep["errors"],
                "timestamp": datetime.now()
            }
            
            self.rep_history.append(rep_data)
            result["rep_completed"] = True
            result["rep_data"] = rep_data
        
        self.previous_pose = pose
        return result