from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Dict, Any
import google.generativeai as genai
from ..core.config import settings
from ..db.session import get_db
from ..schemas.ai_assistant import ChatRequest, ChatResponse
from ..services.ai_service import generate_sql_query, generate_natural_response

router = APIRouter(
    prefix="/ai-assistant",
    tags=["AI Assistant"],
    responses={404: {"description": "Not found"}},
)

# Initialize Gemini API
genai.configure(api_key=settings.GEMINI_API_KEY)

@router.post("/chat", response_model=ChatResponse)
async def chat_with_assistant(
    request: ChatRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Chat with the AI assistant about library-related queries.
    The assistant can help with:
    - Book availability
    - Student borrowing history
    - Popular books
    - Overdue books
    - And other library-related queries
    """
    try:
        # Generate SQL query based on the question
        sql_query = await generate_sql_query(request.question)
        
        # Execute the query and get results
        results = await db.execute(sql_query)
        query_results = results.fetchall()
        
        # Generate natural language response
        response = await generate_natural_response(request.question, query_results)
        
        return ChatResponse(
            response=response,
            sql_query=sql_query  # Including the SQL query for transparency
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error processing your request: {str(e)}"
        ) 