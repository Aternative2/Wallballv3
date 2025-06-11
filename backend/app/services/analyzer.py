import numpy as np
from typing import Optional, Tuple, List
from ..models import Pose, Point3D

class WallBallAnalyzer:
    """Core analysis logic for Wall Ball movements"""
    def __init__(self):
        self.calibrated = False
        self.athlete_height = 1.7  # meters
        self.pixels_per_meter = 200
        self.ground_level = 720
        self.min_squat_depth = 45  # degrees
        self.ankle_ground_threshold = 0.05  # meters
        
    def calculate_joint_angle(self, p1: Point3D, p2: Point3D, p3: Point3D) -> float:
        """Calculate angle between three points"""
        v1 = np.array([p1.x - p2.x, p1.y - p2.y])
        v2 = np.array([p3.x - p2.x, p3.y - p2.y])
        
        cos_angle = np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2))
        angle = np.arccos(np.clip(cos_angle, -1, 1))
        
        return np.degrees(angle)
    
    def calculate_knee_angle(self, pose: Pose) -> Optional[float]:
        """Calculate knee angle between hip, knee, and ankle"""
        if len(pose.landmarks) < 33:
            return None
        
        # Get left side points
        left_hip = pose.landmarks[23]
        left_knee = pose.landmarks[25]
        left_ankle = pose.landmarks[27]
        
        # Get right side points
        right_hip = pose.landmarks[24]
        right_knee = pose.landmarks[26]
        right_ankle = pose.landmarks[28]
        
        # Calculate angles for both sides
        left_angle = self.calculate_joint_angle(left_hip, left_knee, left_ankle)
        right_angle = self.calculate_joint_angle(right_hip, right_knee, right_ankle)
        
        # Return average of both sides
        return (left_angle + right_angle) / 2 if left_angle and right_angle else None
    
    def detect_movement_phase(self, current_pose: Pose, previous_pose: Optional[Pose]) -> str:
        """Detect movement phase based on hip position"""
        if not previous_pose:
            return "UNKNOWN"
        
        current_hip_y = (current_pose.landmarks[23].y + current_pose.landmarks[24].y) / 2
        previous_hip_y = (previous_pose.landmarks[23].y + previous_pose.landmarks[24].y) / 2
        
        movement = current_hip_y - previous_hip_y
        
        if abs(movement) < 0.002:
            return "STATIC"
        return "DESCENDING" if movement > 0 else "ASCENDING"