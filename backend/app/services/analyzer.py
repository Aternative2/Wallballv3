import numpy as np
import cv2
from typing import Optional, Tuple, List, Dict
from ..models import Pose, Point3D, BallPosition
import math
import time

class WallBallAnalyzer:
    """Core analysis logic for Wall Ball movements"""
    def __init__(self):
        # Calibration parameters
        self.calibrated = False
        self.athlete_height = 1.7  # meters
        self.pixels_per_meter = 200
        self.ground_level = 720
        self.min_squat_depth = 45  # degrees
        self.ankle_ground_threshold = 0.05  # meters
        
        # Ball detection parameters
        self.ball_detection_params = {
            'dp': 1.1,
            'min_dist': 30,
            'param1': 20,
            'param2': 20,
            'min_radius': 10,
            'max_radius': 100
        }
        self.frame_count = 0
        self.ball_detection_interval = 10  # Process every 10th frame

        # Reference values
        self.reference_height = None
        self.threshold_y = None
        
        # Debug logging
        self.last_debug_time = 0
        self.debug_interval = 0.5  # seconds
        
        # Movement validation parameters
        self.min_hip_knee_distance = 0.2  # meters
        self.max_hip_knee_distance = 0.8  # meters
        self.min_shoulder_width = 0.3  # meters
        self.max_shoulder_width = 1.0  # meters
        self.min_hip_width = 0.2  # meters
        self.max_hip_width = 0.6  # meters
        self.min_ankle_distance = 0.1  # meters
        self.max_ankle_distance = 0.5  # meters
        
        # Movement continuity parameters
        self.max_position_jump = 0.3  # Maximum allowed position change between frames
        self.previous_positions = {
            'hip': None,
            'knee': None,
            'ankle': None
        }

    def _log_detected_points(self, pose: Pose) -> None:
        """Log detected points with their visibility scores"""
        current_time = time.time()
        if current_time - self.last_debug_time < self.debug_interval:
            return
            
        self.last_debug_time = current_time
        
        # Get key points
        landmarks = pose.landmarks
        key_points = {
            "Left Side": {
                "Shoulder": (11, landmarks[11].visibility if len(landmarks) > 11 else 0),
                "Hip": (23, landmarks[23].visibility if len(landmarks) > 23 else 0),
                "Knee": (25, landmarks[25].visibility if len(landmarks) > 25 else 0),
                "Ankle": (27, landmarks[27].visibility if len(landmarks) > 27 else 0)
            },
            "Right Side": {
                "Shoulder": (12, landmarks[12].visibility if len(landmarks) > 12 else 0),
                "Hip": (24, landmarks[24].visibility if len(landmarks) > 24 else 0),
                "Knee": (26, landmarks[26].visibility if len(landmarks) > 26 else 0),
                "Ankle": (28, landmarks[28].visibility if len(landmarks) > 28 else 0)
            }
        }
        
        # Print debug information
        print("\n=== Detected Points ===")
        for side, points in key_points.items():
            print(f"\n{side}:")
            for point_name, (index, visibility) in points.items():
                print(f"  {point_name} (index {index}): {visibility:.2f}")
        print("=====================\n")

    def calculate_angle(self, a: Point3D, b: Point3D, c: Point3D) -> float:
        """Calculate angle between three points"""
        a_coords = np.array([a.x, a.y])
        b_coords = np.array([b.x, b.y])
        c_coords = np.array([c.x, c.y])
        
        radians = np.arctan2(c_coords[1] - b_coords[1], c_coords[0] - b_coords[0]) - \
                 np.arctan2(a_coords[1] - b_coords[1], a_coords[0] - b_coords[0])
        angle = np.abs(radians * 180.0 / np.pi)
        
        if angle > 180.0:
            angle = 360 - angle
            
        return angle

    def calculate_yaw(self, l_shoulder: Point3D, r_shoulder: Point3D) -> float:
        """Calculate yaw angle (degrees) from left and right shoulder landmarks"""
        dx = l_shoulder.x - r_shoulder.x
        dz = l_shoulder.z - r_shoulder.z
        yaw_rad = math.atan2(dx, dz)
        return math.degrees(yaw_rad)

    def check_visibility(self, pose: Pose) -> Tuple[bool, bool, bool]:
        """Check visibility of upper body and both sides"""
        landmarks = pose.landmarks
        visibility_threshold = 0.5
        
        # Check upper body visibility
        upper_body_visible = any(
            landmarks[i].visibility > visibility_threshold for i in range(13)
        )
        
        # Check left side visibility
        left_side = [23, 25, 27]  # LEFT_HIP, LEFT_KNEE, LEFT_ANKLE
        left_visible = all(
            landmarks[i].visibility > visibility_threshold for i in left_side
        )
        
        # Check right side visibility
        right_side = [24, 26, 28]  # RIGHT_HIP, RIGHT_KNEE, RIGHT_ANKLE
        right_visible = all(
            landmarks[i].visibility > visibility_threshold for i in right_side
        )
        
        return upper_body_visible, left_visible, right_visible

    def detect_ball(self, frame: np.ndarray) -> Optional[Tuple[int, int, int]]:
        """Detect ball using Hough Circle Transform"""
        if self.frame_count % self.ball_detection_interval != 0:
            self.frame_count += 1
            return None

        self.frame_count += 1
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        gray = cv2.medianBlur(gray, 5)
        
        circles = cv2.HoughCircles(
            gray, cv2.HOUGH_GRADIENT,
            dp=self.ball_detection_params['dp'],
            minDist=self.ball_detection_params['min_dist'],
            param1=self.ball_detection_params['param1'],
            param2=self.ball_detection_params['param2'],
            minRadius=self.ball_detection_params['min_radius'],
            maxRadius=self.ball_detection_params['max_radius']
        )
        
        if circles is not None:
            circles = np.uint16(np.around(circles))
            # Take the largest circle
            circle = max(circles[0, :], key=lambda c: c[2])
            return circle[0], circle[1], circle[2] * 2  # center_x, center_y, diameter
        return None

    def calculate_person_height(self, pose: Pose, image_height: int) -> Optional[int]:
        """Calculate person height in pixels"""
        landmarks = pose.landmarks
        if len(landmarks) < 33:
            return None
            
        nose = landmarks[0]  # NOSE
        ankle = landmarks[27]  # LEFT_ANKLE
        
        nose_y = int(nose.y * image_height)
        ankle_y = int(ankle.y * image_height)
        return abs(ankle_y - nose_y)

    def update_reference_height(self, pose: Pose, image_height: int) -> None:
        """Update reference height when person is standing"""
        if self.reference_height is None:
            height = self.calculate_person_height(pose, image_height)
            if height:
                self.reference_height = height
                ankle = pose.landmarks[27]  # LEFT_ANKLE
                ankle_y = int(ankle.y * image_height)
                self.threshold_y = ankle_y - int(1.5 * self.reference_height)

    def check_ball_throw(self, ball_position: Tuple[int, int, int], image_height: int) -> bool:
        """Check if ball is above threshold height"""
        if not self.threshold_y:
            return False
            
        _, ball_y, _ = ball_position
        return ball_y < self.threshold_y

    def validate_person_detection(self, pose: Pose) -> bool:
        """Validate if the detected pose is a legitimate person"""
        if len(pose.landmarks) < 33:
            return False
            
        # Log detected points
        self._log_detected_points(pose)
            
        # Get key landmarks
        landmarks = pose.landmarks
        
        # Check if we have high confidence in the key points
        # Try left side first (23, 25, 27)
        left_side_confidence = all(
            landmarks[i].visibility > 0.8 for i in [23, 25, 27]
        )
        
        # If left side not confident, try right side (24, 26, 28)
        right_side_confidence = all(
            landmarks[i].visibility > 0.8 for i in [24, 26, 28]
        )
        
        if not (left_side_confidence or right_side_confidence):
            return False
            
        return True

    def check_movement_continuity(self, hip: Point3D, knee: Point3D, ankle: Point3D) -> Tuple[bool, str]:
        """Check if the movement is continuous without sudden jumps"""
        if self.previous_positions['hip'] is None:
            # First frame, just store positions
            self.previous_positions = {
                'hip': hip,
                'knee': knee,
                'ankle': ankle
            }
            return True, "First frame"
            
        # Calculate position changes
        hip_jump = self._calculate_distance(hip, self.previous_positions['hip'])
        knee_jump = self._calculate_distance(knee, self.previous_positions['knee'])
        ankle_jump = self._calculate_distance(ankle, self.previous_positions['ankle'])
        
        # Check if any point has moved too far
        if hip_jump > self.max_position_jump:
            return False, f"Hip position jump too large: {hip_jump:.2f}"
        if knee_jump > self.max_position_jump:
            return False, f"Knee position jump too large: {knee_jump:.2f}"
        if ankle_jump > self.max_position_jump:
            return False, f"Ankle position jump too large: {ankle_jump:.2f}"
            
        # Update previous positions
        self.previous_positions = {
            'hip': hip,
            'knee': knee,
            'ankle': ankle
        }
        
        return True, "Movement continuous"

    def validate_squat_movement(self, pose: Pose) -> Tuple[bool, str]:
        """Validate if the current pose represents a legitimate squat movement"""
        if not self.validate_person_detection(pose):
            return False, "Invalid person detection"
            
        landmarks = pose.landmarks
        
        # Determine which side to use based on confidence
        left_side_confidence = all(
            landmarks[i].visibility > 0.8 for i in [23, 25, 27]
        )
        use_left_side = left_side_confidence
        
        # Get key landmarks based on which side is more visible
        if use_left_side:
            hip = landmarks[23]    # Left hip
            knee = landmarks[25]   # Left knee
            ankle = landmarks[27]  # Left ankle
        else:
            hip = landmarks[24]    # Right hip
            knee = landmarks[26]   # Right knee
            ankle = landmarks[28]  # Right ankle
        
        # Check movement continuity
        is_continuous, continuity_reason = self.check_movement_continuity(hip, knee, ankle)
        if not is_continuous:
            return False, continuity_reason
        
        # Calculate knee angle
        knee_angle = self.calculate_angle(hip, knee, ankle)
        
        # Check if hip is above knee (prevent impossible positions)
        if hip.y > knee.y:
            return False, "Invalid hip position"
            
        # Check if knee is above ankle (prevent impossible positions)
        if knee.y > ankle.y:
            return False, "Invalid knee position"
            
        return True, "Valid squat position"

    def _calculate_distance(self, p1: Point3D, p2: Point3D) -> float:
        """Calculate 3D distance between two points"""
        return math.sqrt((p2.x - p1.x)**2 + (p2.y - p1.y)**2 + (p2.z - p1.z)**2)