import numpy as np
from typing import Tuple, List
from ..models import Point3D

def find_angle(p1: Point3D, p2: Point3D, ref_pt: Point3D = None) -> float:
    """Calculate angle between three points"""
    if ref_pt is None:
        ref_pt = Point3D(x=0, y=0, z=0)
    
    # Check for valid coordinates
    if (p1.x is None or p1.y is None or 
        p2.x is None or p2.y is None or 
        ref_pt.x is None or ref_pt.y is None):
        return None
    
    # Convert to numpy arrays
    p1_coords = np.array([p1.x, p1.y])
    p2_coords = np.array([p2.x, p2.y])
    ref_coords = np.array([ref_pt.x, ref_pt.y])
    
    # Calculate vectors
    p1_ref = p1_coords - ref_coords
    p2_ref = p2_coords - ref_coords
    
    # Check for zero vectors
    p1_norm = np.linalg.norm(p1_ref)
    p2_norm = np.linalg.norm(p2_ref)
    
    if p1_norm == 0 or p2_norm == 0:
        return None
    
    # Calculate angle
    cos_theta = np.dot(p1_ref, p2_ref) / (p1_norm * p2_norm)
    cos_theta = np.clip(cos_theta, -1.0, 1.0)
    theta = np.arccos(cos_theta)
    
    return int(180 / np.pi * theta)

def find_vertical_angle(point: Point3D, frame_width: int, frame_height: int) -> float:
    """Calculate vertical angle from a point to the ground"""
    # Create a reference point at the same x-coordinate but at the bottom of the frame
    ref_point = Point3D(x=point.x, y=1.0, z=point.z)  # y=1.0 is bottom of frame
    
    # Calculate angle from vertical
    angle = find_angle(point, ref_point)
    return angle

def get_landmark_coordinates(landmarks: List[Point3D], indices: List[int]) -> List[Point3D]:
    """Get coordinates for specific landmark indices"""
    return [landmarks[i] for i in indices if i < len(landmarks)]

def select_best_side(landmarks: List[Point3D]) -> str:
    """Select the best side (left or right) based on visibility and position"""
    if len(landmarks) < 33:
        return 'left'  # Default to left
    
    # Define landmark indices for left and right sides
    left_side = [11, 23, 25, 27, 31]  # shoulder, hip, knee, ankle, foot
    right_side = [12, 24, 26, 28, 32]
    
    # Calculate average visibility for each side
    left_visibilities = []
    right_visibilities = []
    
    for i in left_side:
        if i < len(landmarks):
            visibility = getattr(landmarks[i], 'visibility', 1.0)
            if visibility is not None:
                left_visibilities.append(visibility)
    
    for i in right_side:
        if i < len(landmarks):
            visibility = getattr(landmarks[i], 'visibility', 1.0)
            if visibility is not None:
                right_visibilities.append(visibility)
    
    # If we have visibility data, use it
    if left_visibilities and right_visibilities:
        left_avg = np.mean(left_visibilities)
        right_avg = np.mean(right_visibilities)
        
        # If one side has significantly better visibility, choose it
        if left_avg > right_avg + 0.1:
            return 'left'
        elif right_avg > left_avg + 0.1:
            return 'right'
    
    # If visibility is similar or unavailable, choose based on shoulder-to-foot distance
    # (closer side to camera is better)
    left_shoulder = landmarks[11] if len(landmarks) > 11 else None
    left_foot = landmarks[31] if len(landmarks) > 31 else None
    right_shoulder = landmarks[12] if len(landmarks) > 12 else None
    right_foot = landmarks[32] if len(landmarks) > 32 else None
    
    if (left_shoulder and left_foot and right_shoulder and right_foot and
        left_shoulder.y is not None and left_foot.y is not None and
        right_shoulder.y is not None and right_foot.y is not None):
        
        left_distance = abs(left_foot.y - left_shoulder.y)
        right_distance = abs(right_foot.y - right_shoulder.y)
        
        return 'left' if left_distance > right_distance else 'right'
    
    return 'left'  # Default fallback 