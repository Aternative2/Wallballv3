import time
from typing import Dict, Any, List, Optional
from ..models import Pose, Point3D
from .utils import find_angle, select_best_side
from .thresholds import get_pro_thresholds

class SquatStateMachine:
    """State machine for tracking squat states and counting reps"""
    
    def __init__(self):
        self.thresholds = get_pro_thresholds()
        
        # State tracking
        self.state_sequence: List[str] = []
        self.current_state: Optional[str] = None
        self.previous_state: Optional[str] = None
        
        # Counters
        self.squat_count = 0
        self.improper_count = 0
        
        # Timing
        self.start_inactive_time = time.perf_counter()
        self.inactive_time = 0.0
        
        # Form validation
        self.incorrect_posture = False
        self.form_feedback = []
        
        # Side selection
        self.selected_side = 'left'
        self.side_landmarks = {
            'left': {'shoulder': 11, 'hip': 23, 'knee': 25, 'ankle': 27, 'foot': 31},
            'right': {'shoulder': 12, 'hip': 24, 'knee': 26, 'ankle': 28, 'foot': 32}
        }

    def _get_state(self, knee_angle: float) -> Optional[str]:
        """Determine squat state based on knee angle"""
        ranges = self.thresholds['KNEE_ANGLE_RANGES']
        
        if ranges['NORMAL'][0] <= knee_angle <= ranges['NORMAL'][1]:
            return 's1'  # Standing
        elif ranges['TRANS'][0] <= knee_angle <= ranges['TRANS'][1]:
            return 's2'  # Transition
        elif ranges['PASS'][0] <= knee_angle <= ranges['PASS'][1]:
            return 's3'  # Deep squat
        
        return None

    def _update_state_sequence(self, state: str) -> None:
        """Update the state sequence for rep counting"""
        if state == 's2':
            # Add s2 if it's the first occurrence or if we have s3 and this is the second s2
            if (('s3' not in self.state_sequence and self.state_sequence.count('s2') == 0) or
                ('s3' in self.state_sequence and self.state_sequence.count('s2') == 1)):
                self.state_sequence.append(state)
        
        elif state == 's3':
            # Add s3 only if we don't have it yet and we have s2
            if state not in self.state_sequence and 's2' in self.state_sequence:
                self.state_sequence.append(state)

    def _validate_form(self, pose: Pose) -> Dict[str, Any]:
        """Validate squat form and return feedback"""
        landmarks = pose.landmarks
        if len(landmarks) < 33:
            return {'valid': False, 'feedback': ['Insufficient landmarks detected']}
        
        # Get landmarks for selected side
        side_lm = self.side_landmarks[self.selected_side]
        shoulder = landmarks[side_lm['shoulder']]
        hip = landmarks[side_lm['hip']]
        knee = landmarks[side_lm['knee']]
        ankle = landmarks[side_lm['ankle']]
        
        # Calculate angles
        hip_vertical_angle = find_angle(shoulder, hip)
        knee_vertical_angle = find_angle(hip, knee)
        ankle_vertical_angle = find_angle(knee, ankle)
        
        feedback = []
        form_valid = True
        
        # Knee angle validation only
        knee_thresh = self.thresholds['KNEE_THRESH']
        if knee_thresh[0] < knee_vertical_angle < knee_thresh[1] and self.state_sequence.count('s2') == 1:
            feedback.append("LOWER YOUR HIPS")
        
        if knee_vertical_angle > knee_thresh[2]:
            feedback.append("SQUAT TOO DEEP")
            form_valid = False
            self.incorrect_posture = True
        
        return {
            'valid': form_valid,
            'feedback': feedback,
            'angles': {
                'hip': hip_vertical_angle,
                'knee': knee_vertical_angle,
                'ankle': ankle_vertical_angle
            }
        }

    def update(self, pose: Pose) -> Dict[str, Any]:
        """Update state machine with new pose data"""
        # Select best side
        self.selected_side = select_best_side(pose.landmarks)
        
        # Get landmarks for selected side
        side_lm = self.side_landmarks[self.selected_side]
        landmarks = pose.landmarks
        
        if len(landmarks) < 33:
            return {
                'state': 'no_pose',
                'squat_count': self.squat_count,
                'improper_count': self.improper_count,
                'feedback': []
            }
        
        hip = landmarks[side_lm['hip']]
        knee = landmarks[side_lm['knee']]
        ankle = landmarks[side_lm['ankle']]
        
        # Calculate knee angle with fallback
        knee_angle = find_angle(hip, knee, ankle)
        
        # If primary side fails, try the other side
        if knee_angle is None:
            other_side = 'right' if self.selected_side == 'left' else 'left'
            other_lm = self.side_landmarks[other_side]
            if (other_lm['hip'] < len(landmarks) and 
                other_lm['knee'] < len(landmarks) and 
                other_lm['ankle'] < len(landmarks)):
                other_hip = landmarks[other_lm['hip']]
                other_knee = landmarks[other_lm['knee']]
                other_ankle = landmarks[other_lm['ankle']]
                knee_angle = find_angle(other_hip, other_knee, other_ankle)
                if knee_angle is not None:
                    self.selected_side = other_side
        
        # If still no angle, return current state without updating
        if knee_angle is None:
            return {
                'state': self.current_state or 'no_pose',
                'state_sequence': self.state_sequence.copy(),
                'squat_count': self.squat_count,
                'improper_count': self.improper_count,
                'form_validation': {'valid': True, 'feedback': [], 'angles': {}},
                'selected_side': self.selected_side,
                'knee_angle': None,
                'inactive_time': self.inactive_time
            }
        
        # Get current state
        self.previous_state = self.current_state
        self.current_state = self._get_state(knee_angle)
        
        # Update state sequence
        if self.current_state:
            self._update_state_sequence(self.current_state)
        
        # Validate form
        form_validation = self._validate_form(pose)
        
        # Update counters
        if self.current_state == 's1':
            if len(self.state_sequence) == 3 and not self.incorrect_posture:
                self.squat_count += 1
            elif 's2' in self.state_sequence and len(self.state_sequence) == 1:
                self.improper_count += 1
            elif self.incorrect_posture:
                self.improper_count += 1
            
            # Reset for next rep
            self.state_sequence = []
            self.incorrect_posture = False
        
        # Update inactivity timer
        if self.current_state == 's1':
            self.start_inactive_time = time.perf_counter()
            self.inactive_time = 0.0
        else:
            self.inactive_time = time.perf_counter() - self.start_inactive_time
        
        # Reset counters if inactive too long
        if self.inactive_time >= self.thresholds['INACTIVE_THRESH']:
            self.squat_count = 0
            self.improper_count = 0
            self.state_sequence = []
        
        return {
            'state': self.current_state,
            'state_sequence': self.state_sequence.copy(),
            'squat_count': self.squat_count,
            'improper_count': self.improper_count,
            'form_validation': form_validation,
            'selected_side': self.selected_side,
            'knee_angle': knee_angle,
            'inactive_time': self.inactive_time
        } 