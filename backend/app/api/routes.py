from fastapi import APIRouter
from typing import Dict

router = APIRouter(prefix="/api", tags=["api"])

@router.get("/session/{session_id}")
async def get_session(session_id: str) -> Dict:
    return {"session_id": session_id, "status": "active"}