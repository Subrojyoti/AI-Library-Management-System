from fastapi import APIRouter, Depends, HTTPException, Body
from fastapi.responses import JSONResponse, StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, Any, AsyncGenerator
import logging
import uuid
import json

from app.dependencies import get_db_session
from app.services.ai_assistant_service import get_ai_assistant_response, process_streaming_ai_response
from app.schemas.ai_assistant import ChatRequest, ChatResponse

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/webhook/", response_model=ChatResponse)
async def ai_assistant_webhook(
    request_body: ChatRequest = Body(...),
    db: AsyncSession = Depends(get_db_session)
) -> ChatResponse:
    """
    Endpoint to receive user queries for the AI assistant.
    It processes the query using the AI assistant service and returns a structured response.
    This is a non-streaming endpoint.
    """
    user_query = request_body.question
    original_question = getattr(request_body, 'original_question', user_query)

    if not user_query:
        logger.warning("AI assistant query is empty.")
        raise HTTPException(status_code=400, detail="Query cannot be empty.")

    try:
        logger.info(f"Received AI assistant query: '{user_query}', Original question to service: '{original_question}'")
        service_response: Dict[str, Any] = await get_ai_assistant_response(
            db=db, 
            query=user_query, 
            original_question=original_question
        )
        logger.info(f"Service response for query '{user_query}': {service_response}")

        # Don't include SQL query in the response to the client
        return ChatResponse(
            response=service_response.get("explanation", "No explanation provided."),
            sql_query=None
        )
    except HTTPException as http_exc:
        logger.warning(f"HTTPException in AI webhook: {http_exc.detail}")
        raise http_exc
    except Exception as e:
        logger.error(f"Unexpected error in AI assistant webhook for query '{user_query}': {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"An unexpected internal error occurred: {str(e)}")

# To include this router in your main application (e.g., in app/main.py):
# from app.routers.ai_assistant import ai_assistant_routes
# app.include_router(ai_assistant_routes.router, prefix="/api/v1/ai-assistant", tags=["AI Assistant"])