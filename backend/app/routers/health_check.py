from fastapi import APIRouter

router = APIRouter()

@router.get("/ping")
async def ping():
    """Simple health check endpoint."""
    return {"status": "ok", "message": "pong!"} 