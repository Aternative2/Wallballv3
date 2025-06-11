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
        self.stats = {
            "total_reps": 0,
            "valid_squats": 0,
            "invalid_squats": 0,
            "valid_throws": 0,  # Placeholder
            "invalid_throws": 0,  # Placeholder
            "total_wallball_reps": 0  # Placeholder
        }
        
    def update(self, pose: Pose) -> Dict[str, Any]:
        """Update tracker with new pose data"""
        # Compute average visibility as a proxy for confidence
        visibilities = [getattr(lm, 'visibility', 1.0) for lm in pose.landmarks]
        avg_visibility = sum(visibilities) / len(visibilities) if visibilities else 1.0

        CONFIDENCE_THRESHOLD = 0.7
        if avg_visibility < CONFIDENCE_THRESHOLD:
            # Skip this frame, do not count squat
            return {
                "phase": self.phase,
                "knee_angle": None,
                "movement": None,
                "rep_completed": False,
                "rep_data": None,
                "stats": self.stats
            }
        
        knee_angle = self.analyzer.calculate_knee_angle(pose)
        movement = self.analyzer.detect_movement_phase(pose, self.previous_pose)
        
        result = {
            "phase": self.phase,
            "knee_angle": knee_angle,
            "movement": movement,
            "rep_completed": False,
            "rep_data": None,
            "stats": self.stats
        }
        
        # State machine for rep tracking
        if self.phase == "READY" and movement == "DESCENDING":
            self.phase = "DESCENDING"
            self.current_rep = {
                "start_time": datetime.now(),
                "max_depth": knee_angle if knee_angle else 0,
            }
            
        elif self.phase == "DESCENDING":
            if knee_angle and knee_angle > self.current_rep["max_depth"]:
                self.current_rep["max_depth"] = knee_angle
            
            # Simple squat validity: knee angle below threshold
            valid_squat = knee_angle is not None and knee_angle < 45
            self.current_rep["valid_squat"] = valid_squat
            
            if movement == "ASCENDING":
                self.phase = "ASCENDING"
                
        elif self.phase == "ASCENDING" and knee_angle and knee_angle < 30:
            # Complete rep
            self.phase = "READY"
            
            # Update stats
            self.stats["total_reps"] += 1
            if self.current_rep.get("valid_squat"):
                self.stats["valid_squats"] += 1
            else:
                self.stats["invalid_squats"] += 1
            # Placeholder: increment wall ball rep if squat is valid (for now)
            if self.current_rep.get("valid_squat"):
                self.stats["total_wallball_reps"] += 1
            # Throws are placeholders (always 0 for now)
            
            rep_data = {
                "rep_number": len(self.rep_history) + 1,
                "valid_squat": self.current_rep.get("valid_squat", False),
                "max_depth": self.current_rep["max_depth"],
                "duration": (datetime.now() - self.current_rep["start_time"]).total_seconds(),
                "timestamp": datetime.now()
            }
            
            self.rep_history.append(rep_data)
            result["rep_completed"] = True
            result["rep_data"] = rep_data
        
        self.previous_pose = pose
        return result