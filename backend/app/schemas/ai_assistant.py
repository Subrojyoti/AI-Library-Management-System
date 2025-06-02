from pydantic import BaseModel, Field
from typing import Optional

class ChatRequest(BaseModel):
    question: str = Field(
        ...,
        description="The question to ask the AI assistant about the library system",
        example="What are the most popular books in the library?"
    )

class ChatResponse(BaseModel):
    response: str = Field(
        ...,
        description="The natural language response from the AI assistant"
    )
    sql_query: Optional[str] = Field(
        None,
        description="The SQL query used to generate the response (for transparency)"
    ) 