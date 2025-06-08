from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class RepData(BaseModel):
    rep_number: int
    valid: bool
    max_depth: float
    max_ball_height: Optional[float] = None
    duration: float
    errors: List[str]
    timestamp: datetime

class SessionData(BaseModel):
    session_id: str
    user_id: Optional[str] = None
    start_time: datetime
    end_time: Optional[datetime] = None
    total_reps: int
    valid_reps: int
    invalid_reps: int
    reps: List[RepData]