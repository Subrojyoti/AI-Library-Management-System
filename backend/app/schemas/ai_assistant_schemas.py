from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Literal, Union

# Router schemas have been moved to ai_assistant.py (ChatRequest and ChatResponse)

# --- Streaming Response Schemas ---
class AIResponseChunkData(BaseModel):
    text_chunk: Optional[str] = None
    tool_name_called: Optional[str] = None
    tool_args_called: Optional[Dict[str, Any]] = None
    tool_response_data: Optional[Any] = None
    error_message: Optional[str] = None
    is_final_text_chunk: bool = False

class AIStreamingResponse(BaseModel):
    conversation_id: str
    response_chunk: AIResponseChunkData

# --- Gemini Service Schemas --- 

class FunctionCall(BaseModel):
    name: str = Field(..., description="Name of the function to call.")
    args: Optional[Dict[str, Any]] = Field({}, description="Arguments for the function call.")


# --- Parameter Schemas for Helper Functions --- 
class SearchBooksParams(BaseModel):
    title: Optional[str] = None
    author: Optional[str] = None
    category: Optional[str] = None
    isbn: Optional[str] = None
    available_only: Optional[bool] = Field(default=False)

class GetStudentDetailsParams(BaseModel):
    student_id: Optional[int] = None
    email: Optional[str] = None
    name: Optional[str] = None

class GetBookAvailabilityParams(BaseModel):
    book_id: Optional[int] = None
    title: Optional[str] = None
    isbn: Optional[str] = None

class GetStudentIssuedBooksParams(BaseModel):
    student_id: Optional[int] = None
    email: Optional[str] = None
    name: Optional[str] = None
    overdue_only: Optional[bool] = Field(default=False)

# --- Library Analytics Parameter Schemas ---
class GetOverdueBooksCountParams(BaseModel):
    pass  # No parameters needed

class GetDepartmentWithMostBorrowsParams(BaseModel):
    pass  # No parameters needed

class GetNewBooksAddedThisWeekParams(BaseModel):
    pass  # No parameters needed

# --- Schemas for Gemini Tool Configuration --- 
class ToolParameterProperty(BaseModel):
    type: str
    description: Optional[str] = None

class ToolParameters(BaseModel):
    type: Literal["object"] = "object"
    properties: Dict[str, ToolParameterProperty]
    required: Optional[List[str]] = None

class Tool(BaseModel):
    name: str
    description: str
    parameters: Dict[str, Any] # Keeping this more flexible to match Gemini's expected structure

class ToolConfig(BaseModel):
    function_declarations: List[Tool]

class GenerationConfig(BaseModel):
    temperature: Optional[float] = None
    top_p: Optional[float] = None
    top_k: Optional[int] = None
    candidate_count: Optional[int] = None
    max_output_tokens: Optional[int] = None
    stop_sequences: Optional[List[str]] = None
    response_mime_type: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return self.model_dump(exclude_none=True) 

# --- LLM Interaction Schemas ---
class LLMPart(BaseModel):
    text: Optional[str] = None
    function_call: Optional[Dict[str, Any]] = None
    function_response: Optional[Dict[str, Any]] = None

class LLMContent(BaseModel):
    role: str  # "user", "model", "tool"
    parts: List[LLMPart] 