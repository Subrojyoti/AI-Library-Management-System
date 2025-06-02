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

@router.post("/streaming/", response_class=StreamingResponse)
async def ai_assistant_streaming(
    request: ChatRequest = Body(...),
    db: AsyncSession = Depends(get_db_session)
):
    """
    Streaming endpoint for the Conversational AI Agent.
    
    Accepts a natural language question and streams back the assistant's responses,
    including potential tool calls and their results.
    
    - **question**: The user's question.
    - **conversation_id**: (optional) An ID to maintain context across multiple turns.
      If not provided, a new one will be generated.
    """
    conv_id = request.conversation_id or str(uuid.uuid4())
    logger.info(f"Received streaming request for AI Agent. Conversation ID: {conv_id}, Question: \"{request.question[:100]}...\"")

    async def sse_event_stream() -> AsyncGenerator[str, None]:
        try:
            async for response_item in process_streaming_ai_response(db, request.question, conv_id):
                # Server-Sent Events format: data: json_payload\n\n
                yield f"data: {response_item.model_dump_json(exclude_none=True)}\n\n"
            logger.info(f"SSE event stream completed for conversation ID: {conv_id}")
        except Exception as e:
            logger.error(f"Error in SSE event stream for conversation ID {conv_id}: {e}", exc_info=True)
            # Send a final error message to the client
            error_response = AIStreamingResponse(
                conversation_id=conv_id,
                response_chunk=AIResponseChunkData(error_message=f"An unexpected error occurred: {str(e)[:100]}", is_final_text_chunk=True)
            )
            yield f"data: {error_response.model_dump_json(exclude_none=True)}\n\n"

    return StreamingResponse(sse_event_stream(), media_type="text/event-stream")

# To include this router in your main application (e.g., in app/main.py):
# from app.routers.ai_assistant import ai_assistant_routes
# app.include_router(ai_assistant_routes.router, prefix="/api/v1/ai-assistant", tags=["AI Assistant"])