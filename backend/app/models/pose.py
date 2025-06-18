# Extract the Point3D and Pose models from the backend artifact
from pydantic import BaseModel
from typing import List, Optional

class Point3D(BaseModel):
    x: float
    y: float
    z: float
    visibility: Optional[float] = 1.0

class BallPosition(BaseModel):
    x: float
    y: float
    diameter: float
    timestamp: float

class Pose(BaseModel):
    landmarks: List[Point3D]
    timestamp: float
    ball_position: Optional[BallPosition] = None