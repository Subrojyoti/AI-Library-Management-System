# This file makes 'schemas' a Python package 

from .book import BookBase, BookCreate, BookUpdate, BookResponse, BookListResponse
from .student import StudentBase, StudentCreate, StudentUpdate, StudentResponse, StudentListResponse
from .issue import BookIssueBase, BookIssueCreate, BookIssueUpdate, BookIssueResponse, BookIssuePage
# Import other schemas here as they are created 

# AI Assistant Schemas - these were added previously and should be retained if this is a full overwrite
from .ai_assistant_schemas import (
    SearchBooksParams, 
    GetStudentDetailsParams, 
    GetBookAvailabilityParams,
    GetStudentIssuedBooksParams,
    FunctionCall,
    Tool,
    ToolConfig,
    GenerationConfig
)