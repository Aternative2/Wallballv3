from typing import Dict, Any, Optional, Tuple
from datetime import datetime
from ..models import Pose, BallPosition
from .analyzer import WallBallAnalyzer
from .state_machine import SquatStateMachine

class RepTracker:
    """Tracks repetitions and validates form using Pro mode state machine"""
    def __init__(self, analyzer: WallBallAnalyzer):
        self.analyzer = analyzer
        self.state_machine = SquatStateMachine()
        
        # Legacy state for compatibility
        self.phase = "READY"
        self.current_rep = None
        self.previous_pose = None
        self.rep_history = []
        
        # Confidence thresholds
        self.visibility_threshold = 0.3
        self.min_detection_confidence = 0.6
        self.min_tracking_confidence = 0.5
        self.consecutive_frames_threshold = 2
        self.consecutive_frames = 0
        
        # State flags
        self.squat_completed = False
        self.throw_completed = False
        self.ball_above_threshold = False
        
        # Counters
        self.stats = {
            "total_reps": 0,
            "valid_squats": 0,
            "invalid_squats": 0,
            "valid_throws": 0,
            "invalid_throws": 0,
            "total_wallball_reps": 0
        }

    def _create_empty_result(self) -> Dict[str, Any]:
        """Create an empty result when confidence checks fail"""
        return {
            "phase": self.phase,
            "knee_angle": None,
            "movement": None,
            "rep_completed": False,
            "rep_data": None,
            "stats": self.stats,
            "state_machine": {
                "state": "no_pose",
                "squat_count": 0,
                "improper_count": 0,
                "feedback": []
            }
        }

    def update(self, pose: Pose, image_height: int, ball_position: Optional[Tuple[int, int, int]] = None) -> Dict[str, Any]:
        """Update tracker with new pose data using Pro mode state machine"""
        # Focus on key landmarks for confidence calculation
        key_landmarks = [23, 24, 25, 26, 27, 28]  # Left and right hip, knee, ankle
        key_visibilities = []
        
        for idx in key_landmarks:
            if idx < len(pose.landmarks):
                visibility = getattr(pose.landmarks[idx], 'visibility', 1.0)
                key_visibilities.append(visibility)
        
        # Calculate confidence based on key landmarks only
        avg_visibility = sum(key_visibilities) / len(key_visibilities) if key_visibilities else 0.0

        # More lenient confidence check
        if avg_visibility < self.min_detection_confidence and len(key_visibilities) < 4:
            self.consecutive_frames = 0
            return self._create_empty_result()

        self.consecutive_frames += 1
        if self.consecutive_frames < self.consecutive_frames_threshold:
            return self._create_empty_result()
        
        # Update state machine
        state_machine_result = self.state_machine.update(pose)
        
        # Update legacy stats to match state machine
        self.stats["valid_squats"] = state_machine_result["squat_count"]
        self.stats["invalid_squats"] = state_machine_result["improper_count"]
        self.stats["total_reps"] = state_machine_result["squat_count"] + state_machine_result["improper_count"]
        
        # Process ball detection if available
        if ball_position:
            is_throw = self.analyzer.check_ball_throw(ball_position, image_height)
            if is_throw and not self.ball_above_threshold:
                self.throw_completed = True
                self.ball_above_threshold = True
                self.stats["valid_throws"] += 1
            elif not is_throw:
                self.ball_above_threshold = False
        
        # Check for wallball completion
        if self.squat_completed and self.throw_completed:
            self.stats["total_wallball_reps"] += 1
            self.squat_completed = False
            self.throw_completed = False
        
        # Create result with both legacy and new state machine data
        result = {
            "phase": self.phase,
            "knee_angle": state_machine_result.get("knee_angle"),
            "movement": state_machine_result.get("state"),
            "rep_completed": False,
            "rep_data": None,
            "stats": self.stats,
            "state_machine": {
                "state": state_machine_result.get("state"),
                "state_sequence": state_machine_result.get("state_sequence", []),
                "squat_count": state_machine_result.get("squat_count", 0),
                "improper_count": state_machine_result.get("improper_count", 0),
                "form_validation": state_machine_result.get("form_validation", {}),
                "selected_side": state_machine_result.get("selected_side", "left"),
                "feedback": state_machine_result.get("form_validation", {}).get("feedback", []),
                "angles": state_machine_result.get("form_validation", {}).get("angles", {}),
                "inactive_time": state_machine_result.get("inactive_time", 0)
            }
        }
        
        # Check if a rep was completed (state machine handles this)
        if state_machine_result.get("state") == "s1" and len(state_machine_result.get("state_sequence", [])) == 0:
            # Rep was just completed by state machine
            if state_machine_result.get("squat_count") > self.stats.get("valid_squats", 0):
                self.squat_completed = True
                result["rep_completed"] = True
                
                rep_data = {
                    "rep_number": len(self.rep_history) + 1,
                    "valid_squat": True,
                    "max_depth": state_machine_result.get("knee_angle", 0),
                    "duration": 0,  # State machine doesn't track duration yet
                    "timestamp": datetime.now()
                }
                
                self.rep_history.append(rep_data)
                result["rep_data"] = rep_data
        
        self.previous_pose = pose
        return result