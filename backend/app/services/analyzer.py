import numpy as np
from typing import Optional
from ..models import Pose, Point3D
from .kalman import KalmanFilter

class WallBallAnalyzer:
    """Core analysis logic for Wall Ball movements"""
    def __init__(self):
        self.angle_filter = KalmanFilter(0.1, 2)
        self.calibrated = False
        self.athlete_height = 1.7  # meters
        self.pixels_per_meter = 200
        self.ground_level = 720
        
    def calculate_joint_angle(self, p1: Point3D, p2: Point3D, p3: Point3D) -> float:
        """Calculate angle between three points"""
        v1 = np.array([p1.x - p2.x, p1.y - p2.y])
        v2 = np.array([p3.x - p2.x, p3.y - p2.y])
        
        cos_angle = np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2))
        angle = np.arccos(np.clip(cos_angle, -1, 1))
        
        return np.degrees(angle)
    
    def calculate_thigh_angle(self, pose: Pose) -> Optional[float]:
        """Calculate thigh angle from horizontal"""
        if len(pose.landmarks) < 33:
            return None
        
        # Average left and right sides
        left_hip = pose.landmarks[23]
        left_knee = pose.landmarks[25]
        right_hip = pose.landmarks[24]
        right_knee = pose.landmarks[26]
        
        avg_hip_y = (left_hip.y + right_hip.y) / 2
        avg_knee_y = (left_knee.y + right_knee.y) / 2
        avg_hip_x = (left_hip.x + right_hip.x) / 2
        avg_knee_x = (left_knee.x + right_knee.x) / 2
        
        # Calculate angle from horizontal
        dx = avg_knee_x - avg_hip_x
        dy = avg_knee_y - avg_hip_y
        
        angle = np.arctan2(abs(dy), abs(dx)) * 180 / np.pi
        angle_from_vertical = 90 - angle
        
        # Apply Kalman filtering
        return self.angle_filter.filter(angle_from_vertical)
    
    def is_squat_valid(self, angle: float) -> bool:
        """Check if squat depth is sufficient"""
        return angle >= 90
    
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