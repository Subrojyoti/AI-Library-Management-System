import google.generativeai as genai
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, Any, List, Optional, Tuple, Callable, AsyncGenerator
import json
import logging
import datetime
import uuid
import re
from sqlalchemy import select, func, or_, text

from backend.app.core.config import settings
from backend.app.schemas.ai_assistant_schemas import (
    SearchBooksParams,
    GetStudentDetailsParams,
    GetBookAvailabilityParams,
    GetStudentIssuedBooksParams,
    FunctionCall,
    Tool,
    ToolConfig,
    GenerationConfig,
    AIStreamingResponse,
    AIResponseChunkData,
    LLMContent,
    LLMPart,
    GetOverdueBooksCountParams,
    GetDepartmentWithMostBorrowsParams,
    GetNewBooksAddedThisWeekParams
)
from backend.app.models.book import Book
from backend.app.models.student import Student
from backend.app.models.book_issue import BookIssue as Issue
from backend.app.services.library_analytics_service import library_analytics_service

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

if settings.GEMINI_API_KEY and settings.GEMINI_API_KEY != "YOUR_GEMINI_API_KEY_HERE":
    try:
        genai.configure(api_key=settings.GEMINI_API_KEY)
        logger.info("Gemini API configured successfully.")
    except Exception as e:
        logger.error(f"Failed to configure Gemini API: {e}")
else:
    logger.warning("GEMINI_API_KEY not found or is a placeholder. AI Assistant functionality will be limited.")

MODEL_NAME = "gemini-1.5-flash"

# Simple in-memory store for conversation histories
conversation_contexts: Dict[str, List[LLMContent]] = {}

# Database schema for Gemini context
DB_SCHEMA = """
The database has the following tables:

1. books:
   - id (integer, primary key)
   - title (text)
   - author (text)
   - isbn (text)
   - num_copies_total (integer)
   - num_copies_available (integer)
   - category (text)
   - created_at (timestamp, when the book was added to the system)
   - updated_at (timestamp)

2. students:
   - id (integer, primary key)
   - name (text)
   - roll_number (text)
   - department (text)
   - semester (integer)
   - phone (text)
   - email (text)
   - created_at (timestamp, when the student was added to the system)
   - updated_at (timestamp)

3. book_issues:
   - id (integer, primary key)
   - book_id (integer, foreign key to books.id)
   - student_id (integer, foreign key to students.id)
   - issue_date (date)
   - expected_return_date (date)
   - actual_return_date (date)
   - is_returned (boolean)
   - created_at (timestamp)
   - updated_at (timestamp)
"""

async def _search_books_with_params(db: AsyncSession, params: SearchBooksParams) -> List[Dict[str, Any]]:
    query = select(Book)
    filters = []
    if params.title:
        filters.append(Book.title.ilike(f"%{params.title}%"))
    if params.author:
        filters.append(Book.author.ilike(f"%{params.author}%"))
    if params.category:
        filters.append(Book.category.ilike(f"%{params.category}%"))
    if params.isbn:
        filters.append(Book.isbn.ilike(f"%{params.isbn}%"))
    
    if filters:
        query = query.where(or_(*filters))

    logger.info(f"Executing book search with params: {params}. Query: {query}")
    result = await db.execute(query)
    all_books_matching_text = result.scalars().all()

    final_results = []
    if not all_books_matching_text:
        return []

    book_ids_to_check_availability = [b.id for b in all_books_matching_text]

    issues_subquery = (
        select(Issue.book_id, func.count(Issue.id).label("issued_count"))
        .where(Issue.book_id.in_(book_ids_to_check_availability))
        .where(Issue.returned_date.is_(None))
        .group_by(Issue.book_id)
        .subquery()
    )

    books_with_counts_stmt = (
        select(Book, func.coalesce(issues_subquery.c.issued_count, 0).label("issued_count"))
        .select_from(Book)
        .outerjoin(issues_subquery, Book.id == issues_subquery.c.book_id)
        .where(Book.id.in_(book_ids_to_check_availability))
    )
    
    result_with_counts = await db.execute(books_with_counts_stmt)
    books_with_counts = result_with_counts.all()

    for book_row in books_with_counts:
        book = book_row[0]
        issued_count = book_row[1]
        available_copies = book.quantity - issued_count
        if params.available_only and available_copies <= 0:
            continue
        
        final_results.append({
            "id": book.id, "title": book.title, "author": book.author,
            "isbn": book.isbn, "genre": book.genre, "quantity": book.quantity,
            "published_date": book.published_date.isoformat() if book.published_date else None,
            "available_copies": available_copies
        })
    return final_results

async def _get_student_details_with_params(db: AsyncSession, params: GetStudentDetailsParams) -> Optional[Dict[str, Any]]:
    query = select(Student)
    student_filters = []
    if params.student_id:
        student_filters.append(Student.id == params.student_id)
    if params.email:
        student_filters.append(Student.email.ilike(f"%{params.email}%"))
    if params.name:
        student_filters.append(Student.name.ilike(f"%{params.name}%"))
    
    if not student_filters: return None
        
    query = query.where(or_(*student_filters))
    logger.info(f"Executing student details search with params: {params}")
    result = await db.execute(query)
    student = result.scalars().first()
    if student:
        return {
            "id": student.id, "name": student.name, "email": student.email,
            "phone_number": student.phone_number,
            "membership_date": student.membership_date.isoformat() if student.membership_date else None,
        }
    return None

async def _get_book_availability_with_params(db: AsyncSession, params: GetBookAvailabilityParams) -> Optional[Dict[str, Any]]:
    book_query = select(Book)
    book_filters = []
    if params.book_id: book_filters.append(Book.id == params.book_id)
    if params.title: book_filters.append(Book.title.ilike(f"%{params.title}%"))
    if params.isbn: book_filters.append(Book.isbn == params.isbn)

    if not book_filters: return {"error": "Book ID, title, or ISBN is required."}
        
    book_query = book_query.where(or_(*book_filters))
    logger.info(f"Executing book availability search with params: {params}")
    result = await db.execute(book_query)
    book = result.scalar_one_or_none()

    if not book: return {"error": "Book not found."}

    issues_count_query = select(func.count(Issue.id)).where(
        Issue.book_id == book.id, Issue.returned_date.is_(None)
    )
    result_issues_count = await db.execute(issues_count_query)
    current_issues_count = result_issues_count.scalar_one_or_none() or 0
    available_copies = book.quantity - current_issues_count

    return {
        "book_id": book.id, "title": book.title, "total_quantity": book.quantity,
        "available_copies": available_copies, "is_available": available_copies > 0,
    }

async def _get_student_issued_books_with_params(db: AsyncSession, params: GetStudentIssuedBooksParams) -> List[Dict[str, Any]]:
    student_query = select(Student.id)
    student_identifying_filters = []

    if params.student_id: student_identifying_filters.append(Student.id == params.student_id)
    if params.email: student_identifying_filters.append(Student.email.ilike(f"%{params.email}%"))
    if params.name: student_identifying_filters.append(Student.name.ilike(f"%{params.name}%"))

    if not student_identifying_filters: return [{"error": "Student ID, email, or name is required."}]
    
    student_query = student_query.where(or_(*student_identifying_filters))
    result_student_id = await db.execute(student_query)
    student_id_to_query = result_student_id.scalars().first()

    if not student_id_to_query: return [{"error": "Student not found."}]
    
    logger.info(f"Executing student issued books search for student ID: {student_id_to_query} with params: {params}")
    
    issues_query = select(Issue, Book.title, Book.isbn).join(Book, Issue.book_id == Book.id).where(
        Issue.student_id == student_id_to_query, Issue.returned_date.is_(None) 
    )
    
    today = datetime.date.today()
    if params.overdue_only:
        issues_query = issues_query.where(Issue.due_date < today)

    result_issues = await db.execute(issues_query)
    issued_items = result_issues.all()
    
    issued_books_data = []
    for issue_row in issued_items:
        issue_obj = issue_row[0]
        book_title = issue_row[1]
        book_isbn = issue_row[2]
        is_overdue_val = issue_obj.due_date < today if issue_obj.due_date else False
        issued_books_data.append({
            "issue_id": issue_obj.id, "book_id": issue_obj.book_id,
            "book_title": book_title, "book_isbn": book_isbn,
            "issue_date": issue_obj.issue_date.isoformat() if issue_obj.issue_date else None,
            "due_date": issue_obj.due_date.isoformat() if issue_obj.due_date else None,
            "is_overdue": is_overdue_val,
        })
    return issued_books_data

async def _get_overdue_books_count_with_params(db: AsyncSession, params: GetOverdueBooksCountParams) -> int:
    return await library_analytics_service.get_overdue_books_count(db=db)

async def _get_department_with_most_borrows_with_params(db: AsyncSession, params: GetDepartmentWithMostBorrowsParams) -> Dict[str, Any]:
    return await library_analytics_service.get_department_with_most_borrows_last_month(db=db)

async def _get_new_books_added_this_week_with_params(db: AsyncSession, params: GetNewBooksAddedThisWeekParams) -> int:
    return await library_analytics_service.get_new_books_added_this_week_count(db=db)

FUNCTION_MAP: Dict[str, Tuple[Callable, type]] = {
    "search_books": (_search_books_with_params, SearchBooksParams),
    "get_student_details": (_get_student_details_with_params, GetStudentDetailsParams),
    "get_book_availability": (_get_book_availability_with_params, GetBookAvailabilityParams),
    "get_student_issued_books": (_get_student_issued_books_with_params, GetStudentIssuedBooksParams),
    "get_overdue_books_count": (_get_overdue_books_count_with_params, GetOverdueBooksCountParams),
    "get_department_with_most_borrows": (_get_department_with_most_borrows_with_params, GetDepartmentWithMostBorrowsParams),
    "get_new_books_added_this_week": (_get_new_books_added_this_week_with_params, GetNewBooksAddedThisWeekParams),
}

TOOLS_CONFIG = ToolConfig(
    function_declarations=[
        Tool(
            name="search_books",
            description="Search for books in the library catalog by title, author, or category. Can filter to only include books with available copies.",
            parameters={
                "type": "object",
                "properties": {
                    "title": {"type": "string", "description": "Optional. Partial or full title to search for."},
                    "author": {"type": "string", "description": "Optional. Partial or full author name to search for."},
                    "category": {"type": "string", "description": "Optional. Category or genre to filter by."},
                    "available_only": {"type": "boolean", "description": "Optional. If true, only returns books with available copies."}
                }
            }
        ),
        Tool(
            name="get_student_details",
            description="Get detailed information about a student by ID, email, or name.",
            parameters={
                "type": "object",
                "properties": {
                    "student_id": {"type": "integer", "description": "Optional. The numeric ID of the student."},
                    "email": {"type": "string", "description": "Optional. The email address of the student."},
                    "name": {"type": "string", "description": "Optional. The name of the student."}
                }
            }
        ),
        Tool(
            name="get_book_availability",
            description="Check if a specific book is available and how many copies are currently available.",
            parameters={
                "type": "object",
                "properties": {
                    "book_id": {"type": "integer", "description": "Optional. The numeric ID of the book."},
                    "title": {"type": "string", "description": "Optional. The title of the book."},
                    "isbn": {"type": "string", "description": "Optional. The ISBN of the book."}
                }
            }
        ),
        Tool(
            name="get_student_issued_books",
            description="Get a list of all books currently issued to a student.",
            parameters={
                "type": "object",
                "properties": {
                    "student_id": {"type": "integer", "description": "Optional. The numeric ID of the student."},
                    "email": {"type": "string", "description": "Optional. The email address of the student."},
                    "name": {"type": "string", "description": "Optional. The name of the student."},
                    "overdue_only": {"type": "boolean", "description": "Optional. If true, only returns overdue books."}
                }
            }
        ),
        Tool(
            name="get_overdue_books_count",
            description="Gets the total number of books that are currently overdue in the library.",
            parameters={
                "type": "object",
                "properties": {}
            }
        ),
        Tool(
            name="get_department_with_most_borrows",
            description="Identifies which department borrowed the most books in the previous calendar month and how many books they borrowed.",
            parameters={
                "type": "object",
                "properties": {}
            }
        ),
        Tool(
            name="get_new_books_added_this_week",
            description="Gets the total count of new books that were added to the library's collection within the current week (from Monday to Sunday).",
            parameters={
                "type": "object",
                "properties": {}
            }
        )
    ]
)

def _get_system_instructions() -> str:
    return """You are a helpful AI assistant for a college library management system.
You can help librarians and administrators find information about books, students, and book issues.
You can search for books, check their availability, get student details, and see which books a student has checked out.
You can also provide analytics about overdue books, department borrowing patterns, and new book acquisitions.

When asked questions you don't know how to answer, use the appropriate tools available to you to look up the information.
Always be respectful, concise, and helpful in your responses.

Examples of questions you can answer:
- How many books are overdue right now?
- Which department borrowed the most books last month?
- How many new books were added this week?
- Is "The Great Gatsby" available?
- Show me all books by "J.K. Rowling"
- What books has student "John Smith" borrowed?
- Tell me about the student with email "jane@example.com"
"""

async def _call_llm_api_stream(
    history: List[LLMContent],
    tools_config_for_llm
) -> AsyncGenerator[AIResponseChunkData, None]:
    """
    Stream calls to the LLM API with tool support.
    For now, implements a mock LLM with basic tool calling capabilities.
    """
    user_question = ""
    last_message = history[-1] if history else None
    if last_message and last_message.role == "user" and last_message.parts:
        user_question = last_message.parts[0].text or ""

    # If the real LLM is not available, provide mock responses
    if not settings.GEMINI_API_KEY or settings.GEMINI_API_KEY == "YOUR_GEMINI_API_KEY_HERE":
        logger.warning(f"Using MOCK LLM responses for question: '{user_question[:50]}...'")
        
        # Mock logic based on question keywords
        if "overdue" in user_question.lower():
            yield AIResponseChunkData(tool_name_called="get_overdue_books_count", tool_args_called={})
        elif "department" in user_question.lower() and "borrow" in user_question.lower():
            yield AIResponseChunkData(tool_name_called="get_department_with_most_borrows", tool_args_called={})
        elif "new books" in user_question.lower() and "week" in user_question.lower():
            yield AIResponseChunkData(tool_name_called="get_new_books_added_this_week", tool_args_called={})
        elif "available" in user_question.lower() and any(book in user_question.lower() for book in ["book", "title", "copy"]):
            # Try to extract a title if mentioned
            yield AIResponseChunkData(tool_name_called="get_book_availability", tool_args_called={"title": user_question.split("available")[0].strip()})
        elif last_message and last_message.role == "tool":
            # If last message was a tool response, mock a final answer
            tool_response_part = last_message.parts[0].function_response if last_message.parts else None
            if tool_response_part:
                tool_name = tool_response_part.get("name", "unknown_tool")
                tool_data = tool_response_part.get("response", {})
                yield AIResponseChunkData(text_chunk=f"Based on the information I found: ", is_final_text_chunk=False)
                
                if tool_name == "get_overdue_books_count":
                    yield AIResponseChunkData(text_chunk=f"There are currently {tool_data} books overdue in the library.", is_final_text_chunk=True)
                elif tool_name == "get_department_with_most_borrows":
                    dept = tool_data.get("department", "Unknown")
                    count = tool_data.get("borrow_count", 0)
                    yield AIResponseChunkData(text_chunk=f"The {dept} department borrowed the most books last month with {count} borrows.", is_final_text_chunk=True)
                elif tool_name == "get_new_books_added_this_week":
                    yield AIResponseChunkData(text_chunk=f"This week, {tool_data} new books were added to the library collection.", is_final_text_chunk=True)
                elif tool_name == "get_book_availability":
                    title = tool_data.get("title", "The book")
                    available = tool_data.get("available_copies", 0)
                    if available > 0:
                        yield AIResponseChunkData(text_chunk=f"{title} is available with {available} copies that can be borrowed.", is_final_text_chunk=True)
                    else:
                        yield AIResponseChunkData(text_chunk=f"{title} is currently not available for borrowing.", is_final_text_chunk=True)
                else:
                    yield AIResponseChunkData(text_chunk=f"Here is the result: {tool_data}", is_final_text_chunk=True)
            else:
                yield AIResponseChunkData(text_chunk="I've processed your request. Is there anything else you'd like to know?", is_final_text_chunk=True)
        else:
            yield AIResponseChunkData(text_chunk="I'm your library assistant. I can help with questions about: ", is_final_text_chunk=False)
            yield AIResponseChunkData(text_chunk="overdue books, department borrowing trends, new book additions, ", is_final_text_chunk=False)
            yield AIResponseChunkData(text_chunk="book availability, student details, and issued books.", is_final_text_chunk=True)
        return

    # Actual LLM API Call (when API key is configured)
    try:
        model = genai.GenerativeModel(
            model_name=MODEL_NAME,
            generation_config={"temperature": 0.2, "top_p": 0.8, "top_k": 40},
            tools=tools_config_for_llm.function_declarations
        )
        
        # Convert Pydantic history to the format expected by the Gemini SDK
        content = []
        for msg in history:
            if msg.role == "user":
                content.append({"role": "user", "parts": [{"text": msg.parts[0].text}]})
            elif msg.role == "model" or msg.role == "assistant":
                parts = []
                for part in msg.parts:
                    if part.text:
                        parts.append({"text": part.text})
                    # Handle function calls in history
                    if part.function_call:
                        parts.append({"function_call": part.function_call})
                content.append({"role": "model", "parts": parts})
            elif msg.role == "tool":
                for part in msg.parts:
                    if part.function_response:
                        content.append({"role": "function", "parts": [{"function_response": part.function_response}]})
        
        response_stream = await model.generate_content_async(
            content,
            stream=True
        )
        
        # Process the streaming response
        async for chunk in response_stream:
            if not chunk.parts:
                continue
                
            for part in chunk.parts:
                if hasattr(part, "text") and part.text:
                    yield AIResponseChunkData(text_chunk=part.text, is_final_text_chunk=False)
                if hasattr(part, "function_call") and part.function_call:
                    function_call_data = part.function_call
                    yield AIResponseChunkData(
                        tool_name_called=function_call_data.name,
                        tool_args_called=function_call_data.args
                    )
                    return  # Stop processing this stream after a function call
        
        # If we got here, there was no function call, so mark the last chunk as final
        yield AIResponseChunkData(is_final_text_chunk=True)
        
    except Exception as e:
        logger.error(f"Error during LLM API call: {e}", exc_info=True)
        yield AIResponseChunkData(error_message=f"LLM API Error: {str(e)[:150]}", is_final_text_chunk=True)

async def process_streaming_ai_response(
    db: AsyncSession,
    user_query: str,
    conversation_id: str
) -> AsyncGenerator[AIStreamingResponse, None]:
    """
    Manages the multi-turn interaction with the LLM, including tool calls.
    Yields AIStreamingResponse objects.
    """
    MAX_INTERACTION_TURNS = 5  # Safety limit for tool-use loops
    current_interaction_turn = 0

    # Get or initialize conversation history
    history = conversation_contexts.get(conversation_id, [])
    if not history:
        # Initialize with system instructions if starting a new conversation
        system_instructions = _get_system_instructions()
        history.append(LLMContent(role="user", parts=[LLMPart(text=system_instructions)]))
        history.append(LLMContent(role="model", parts=[LLMPart(text="I'm your library assistant. How can I help you?")]))
    
    # Add current user question to history
    history.append(LLMContent(role="user", parts=[LLMPart(text=user_query)]))
    conversation_contexts[conversation_id] = history
    
    while current_interaction_turn < MAX_INTERACTION_TURNS:
        current_interaction_turn += 1
        logger.info(f"Conv ID '{conversation_id}', Turn {current_interaction_turn}: Sending to LLM. History length: {len(history)}")

        llm_made_tool_call = False
        async for llm_chunk in _call_llm_api_stream(history, TOOLS_CONFIG):
            # Wrap the chunk in an AIStreamingResponse and yield
            yield AIStreamingResponse(conversation_id=conversation_id, response_chunk=llm_chunk)

            if llm_chunk.tool_name_called:
                llm_made_tool_call = True
                tool_name = llm_chunk.tool_name_called
                tool_args = llm_chunk.tool_args_called or {}
                
                logger.info(f"Conv ID '{conversation_id}': LLM requested tool call: '{tool_name}' with args: {tool_args}")

                if tool_name in FUNCTION_MAP:
                    tool_function, params_model = FUNCTION_MAP[tool_name]
                    tool_output_data = None
                    tool_error = None
                    
                    try:
                        # Create params object from the args dict
                        params_instance = params_model(**tool_args)
                        # Check if tool needs db and pass it
                        if "db" in tool_function.__code__.co_varnames:
                            tool_output_data = await tool_function(db=db, params=params_instance)
                        else:
                            tool_output_data = await tool_function(params=params_instance)
                        logger.info(f"Conv ID '{conversation_id}': Tool '{tool_name}' executed. Output: {str(tool_output_data)[:200]}")
                    except Exception as e:
                        logger.error(f"Conv ID '{conversation_id}': Error executing tool '{tool_name}': {e}", exc_info=True)
                        tool_error = str(e)
                        # Yield an error message to the client
                        yield AIStreamingResponse(
                            conversation_id=conversation_id,
                            response_chunk=AIResponseChunkData(
                                error_message=f"Error when trying to use tool '{tool_name}': {tool_error[:100]}",
                                is_final_text_chunk=False
                            )
                        )
                    
                    # Prepare tool response for LLM
                    tool_response_for_llm = {
                        "name": tool_name,
                        "response": {"output": tool_output_data} if not tool_error else {"error": tool_error}
                    }
                    
                    tool_response_part = LLMPart(function_response=tool_response_for_llm)
                    history.append(LLMContent(role="tool", parts=[tool_response_part]))
                    conversation_contexts[conversation_id] = history
                    
                    # Yield the tool response data to the client as well
                    yield AIStreamingResponse(
                        conversation_id=conversation_id,
                        response_chunk=AIResponseChunkData(
                            tool_response_data=tool_output_data,
                            is_final_text_chunk=False
                        )
                    )
                    
                    # Break to start a new call to LLM with the tool response
                    break
                else:
                    logger.error(f"Conv ID '{conversation_id}': LLM called unknown tool: '{tool_name}'")
                    unknown_tool_msg = f"I tried to use a tool named '{tool_name}', but I don't have it."
                    history.append(LLMContent(role="model", parts=[LLMPart(text=unknown_tool_msg)]))
                    conversation_contexts[conversation_id] = history
                    yield AIStreamingResponse(
                        conversation_id=conversation_id,
                        response_chunk=AIResponseChunkData(text_chunk=unknown_tool_msg, is_final_text_chunk=True)
                    )
                    return  # End interaction

            elif llm_chunk.is_final_text_chunk or llm_chunk.error_message:
                # LLM finished generating text or sent an error
                if llm_chunk.text_chunk:
                    # Add assistant's final text to history
                    history.append(LLMContent(role="model", parts=[LLMPart(text=llm_chunk.text_chunk)]))
                conversation_contexts[conversation_id] = history
                return  # End of interaction

        if not llm_made_tool_call:
            # If LLM finished without making a tool call and without is_final_text_chunk,
            # assume it's done
            logger.info(f"Conv ID '{conversation_id}': LLM finished turn {current_interaction_turn} without a tool call.")
            return

    # Loop limit reached
    logger.warning(f"Conv ID '{conversation_id}': Max interaction turns ({MAX_INTERACTION_TURNS}) reached.")
    yield AIStreamingResponse(
        conversation_id=conversation_id,
        response_chunk=AIResponseChunkData(
            error_message=f"Sorry, this is taking too many steps. Please try rephrasing your question.",
            is_final_text_chunk=True
        )
    )

async def get_ai_assistant_response(db: AsyncSession, query: str, original_question: str) -> Dict[str, Any]:
    """
    Use Gemini to generate a SQL query and a natural language response for the user's question.
    """
    if not settings.GEMINI_API_KEY:
        return {
            "explanation": "Gemini API key is not configured. Please contact the administrator.",
            "sql_query": None
        }

    # First, determine if the question can be answered with our database
    scope_check_prompt = f"""
Given this question: "{query}"
And this database schema:
{DB_SCHEMA}

Determine if this question can be answered using ONLY the data in this database schema.
Respond with either:
- "ANSWERABLE: <reason>" if the question can be answered using this database
- "UNANSWERABLE: <reason>" if the question cannot be answered with this database

For example:
- "How many books are overdue?" → "ANSWERABLE: The question can be answered using book_issues table with is_returned and expected_return_date fields"
- "What's the weather like today?" → "UNANSWERABLE: The database has no weather information"
- "Who wrote Harry Potter?" → "UNANSWERABLE: While the database has book titles and authors, it can't answer general knowledge questions about specific books"
"""

    try:
        scope_response = model = genai.GenerativeModel('gemini-1.5-flash').generate_content(scope_check_prompt)
        scope_result = scope_response.text.strip()
        
        # Check if question is unanswerable
        if scope_result.upper().startswith("UNANSWERABLE"):
            reason = scope_result[scope_result.find(":")+1:].strip() if ":" in scope_result else "This question is outside the scope of the library database."
            return {
                "explanation": f"I'm sorry, but I can't answer that question. {reason} I can help with questions about books, students, and borrowing records in the library database.",
                "sql_query": None
            }
    except Exception as e:
        logger.warning(f"Error during question scope check: {e}")
        # Continue even if scope check fails
    
    model = genai.GenerativeModel('gemini-1.5-flash')

    # 1. Generate SQL query with explicit instructions about table names
    prompt_sql = f"""
Given the following database schema:
{DB_SCHEMA}

IMPORTANT: The table names are exactly as shown above: "books", "students", and "book_issues" (plural).

Generate a single SELECT SQL query to answer this question: {query}

If the question CANNOT be answered using this database schema:
1. Provide a comment explaining why it can't be answered
2. Return NULL or a simple fallback query that's close to what was asked

Your query must:
1. Use the exact table names as shown in the schema
2. Include proper JOINs if needed
3. Be a valid PostgreSQL query
4. Use the created_at field for questions about when books or students were added
5. EXTREMELY IMPORTANT: Use ILIKE instead of LIKE for ALL text field comparisons to ensure case-insensitive matching
   For example: 
   - WHERE books.category ILIKE '%biology%' instead of WHERE books.category = 'Biology'
   - WHERE books.title ILIKE '%harry%' instead of WHERE books.title = 'Harry Potter'
   - WHERE books.author ILIKE '%rowling%' instead of WHERE books.author = 'J.K. Rowling'
6. NEVER use exact equality (=) for text fields like title, author, category, etc. Always use ILIKE with wildcards.
7. For category searches specifically, always wrap the search term in wildcards: ILIKE '%biology%' not ILIKE 'biology%'

For time-based queries (e.g. "this week", "today", "last month"), use PostgreSQL date functions like 
CURRENT_DATE and date_trunc('week', CURRENT_DATE) to handle date ranges appropriately.
    """
    
    try:
        sql_response = model.generate_content(prompt_sql)
        sql_query = sql_response.text.strip()
        
        # If the response indicates the question is out of scope
        if "cannot be answered" in sql_query.lower() or "can't be answered" in sql_query.lower():
            # Extract the explanation from the SQL comment if present
            explanation_match = re.search(r'--\s*(.*?)\n', sql_query)
            explanation = explanation_match.group(1) if explanation_match else "This question is outside the scope of the library database."
            return {
                "explanation": f"I'm sorry, but I can't answer that question. {explanation} I can help with questions about books, students, and borrowing records in the library database.",
                "sql_query": sql_query
            }
        
        # Remove markdown code block formatting if present
        sql_query = re.sub(r'^```[a-zA-Z]*\n?', '', sql_query)
        sql_query = re.sub(r'```$', '', sql_query).strip()
        
        # Improved SQL validation - check if there's a SELECT statement anywhere in the query
        # This handles cases where there are comments before the actual SELECT
        contains_select = bool(re.search(r'^\s*(?:--.*?[\r\n]|\n)*\s*SELECT', sql_query, re.IGNORECASE | re.MULTILINE))
        if not contains_select:
            logger.warning(f"Non-SELECT query generated: {sql_query}")
            return {
                "explanation": "Sorry, I can only answer questions that can be answered with a SELECT query.",
                "sql_query": sql_query
            }
            
        # Additional safety check: ensure we're using the correct table name
        if "book_issue " in sql_query and "book_issues" not in sql_query:
            sql_query = sql_query.replace("book_issue ", "book_issues ")
            logger.info(f"Fixed table name in query: {sql_query}")
        
        # Replace any case-sensitive LIKE with case-insensitive ILIKE
        # This is especially important for category searches
        if " LIKE " in sql_query.upper():
            sql_query = re.sub(r'(?i)\s+LIKE\s+', ' ILIKE ', sql_query)
            logger.info(f"Replaced LIKE with ILIKE for case-insensitive matching: {sql_query}")
        
        # Also replace any exact equality comparisons on text fields with ILIKE
        for field in ['category', 'title', 'author', 'genre', 'department']:
            pattern = r'(?i)' + field + r'\s*=\s*[\'"](.*?)[\'"](\s|$)'
            if re.search(pattern, sql_query):
                sql_query = re.sub(pattern, lambda m: f"{field} ILIKE '%{m.group(1)}%'{m.group(2)}", sql_query)
                logger.info(f"Replaced exact equality with ILIKE for {field}: {sql_query}")
            
        # Strip comments from the SQL query before execution
        # But preserve the original query with comments for display
        display_sql_query = sql_query
        sql_query_for_execution = re.sub(r'--.*?(?:\r\n|\n)', '\n', sql_query)
        sql_query_for_execution = re.sub(r'\s+', ' ', sql_query_for_execution).strip()
    except Exception as e:
        logger.error(f"Error generating SQL query: {e}")
        return {
            "explanation": f"I encountered an error while generating the SQL query: {str(e)}",
            "sql_query": None
        }

    # 2. Execute the SQL query
    try:
        logger.info(f"Executing SQL: {sql_query_for_execution}")
        result = await db.execute(text(sql_query_for_execution))
        rows = result.fetchall()
        
        if not rows:
            return {
                "explanation": "I couldn't find any data matching your query.",
                "sql_query": display_sql_query
            }
        
        # Handle the results properly, considering that description might be None
        # for some queries like COUNT(*)
        data = []
        try:
            if result.cursor and result.cursor.description:
                # Standard case - we have column names
                columns = [col[0] for col in result.cursor.description]
                data = [dict(zip(columns, row)) for row in rows]
            else:
                # Handle aggregate functions or other cases where description might be None
                # Just use the raw values as they are
                if len(rows) == 1 and len(rows[0]) == 1:
                    # Most likely a COUNT(*) or similar
                    data = rows[0][0]  # Just return the scalar value
                else:
                    # Return a list of row values (as tuples)
                    data = rows
        except Exception as e:
            logger.warning(f"Error processing SQL results, using raw data: {e}")
            # Fallback - just convert to strings
            data = str(rows)
            
        logger.info(f"Query returned results: {data}")
    except Exception as e:
        logger.error(f"Error executing SQL query: {e}")
        return {
            "explanation": f"There was an error executing the generated SQL query: {e}",
            "sql_query": display_sql_query
        }

    # Helper function to filter out borrowing information from responses
    def filter_borrowing_info(text):
        # Patterns to match and remove borrowing information
        patterns = [
            # Basic patterns
            r'\s+has been borrowed \d+ times?\.',  # "has been borrowed X times."
            r'\s+borrowed \d+ times?\.',  # "borrowed X times."
            r'\s+checked out \d+ times?\.',  # "checked out X times."
            r'\s+issued \d+ times?\.',  # "issued X times."
            
            # Variations with subjects
            r'\s+It has been borrowed \d+ times?\.',  # "It has been borrowed X times."
            r'\s+This book has been borrowed \d+ times?\.',  # "This book has been borrowed X times."
            r'\s+This title has been borrowed \d+ times?\.',  # "This title has been borrowed X times."
            r'\s+The book has been borrowed \d+ times?\.',  # "The book has been borrowed X times."
            r'\s+It is currently borrowed \d+ times?\.',  # "It is currently borrowed X times."
            r'\s+This title has been checked out \d+ times?\.',  # "This title has been checked out X times."
            
            # Category-specific variations
            r'\s+This [a-z]+ book has been borrowed \d+ times?\.',  # "This biology book has been borrowed X times."
            r'\s+This [a-z]+ textbook has been borrowed \d+ times?\.',  # "This biology textbook has been borrowed X times."
            
            # Frequency variations
            r'\s+and has been borrowed \d+ times?\.',  # "and has been borrowed X times."
            r'\s+which has been borrowed \d+ times?\.',  # "which has been borrowed X times."
            r'\s+with \d+ borrows?\.',  # "with X borrows."
            r'\s+having been borrowed \d+ times?\.',  # "having been borrowed X times."
            
            # Popularity mentions
            r'\. It is (?:quite |very |extremely )?popular, having been borrowed \d+ times?\.',  # "It is popular, having been borrowed X times."
            r'\. This book is (?:quite |very |extremely )?popular and has been borrowed \d+ times?\.',  # "This book is popular and has been borrowed X times."
        ]
        
        filtered_text = text
        for pattern in patterns:
            filtered_text = re.sub(pattern, '.', filtered_text)
        
        # Also remove any sentences that mention borrowing frequency in other formats
        borrowing_patterns = [
            r'[^.]*borrowed \d+ times[^.]*\.',  # Any sentence with "borrowed X times"
            r'[^.]*checked out \d+ times[^.]*\.',  # Any sentence with "checked out X times"
        ]
        
        for pattern in borrowing_patterns:
            filtered_text = re.sub(pattern, '', filtered_text)
            
        # Clean up any double periods that might have been created
        filtered_text = re.sub(r'\.\s*\.', '.', filtered_text)
        # Clean up any spaces before periods
        filtered_text = re.sub(r'\s+\.', '.', filtered_text)
            
        return filtered_text

    # 3. Generate natural language response
    try:
        # Format the data appropriately for the prompt
        if isinstance(data, (int, float)):
            results_str = str(data)
        else:
            results_str = str(data)
            
        prompt_nl = f"""
Given the question: "{query}" and the query results: {results_str}, provide a natural language response.

The response should:
1. Directly answer the question
2. Include specific numbers or data from the results, but NEVER mention borrowing frequency
3. Be clear and concise
4. Use a friendly, helpful tone
5. IMPORTANT: Do NOT mention ratings (like star ratings) as there is no rating system in this library database
6. When discussing popular books, do NOT mention borrowing frequency or issue count at all
7. EXTREMELY IMPORTANT: Do NOT mention how many times a book has been borrowed in your response
8. Focus on the book's title, author, and other details, but completely omit borrowing statistics
9. Do NOT include phrases like "borrowed X times" or "checked out X times" or any variation of these
10. If the data shows borrowing counts, DO NOT include this information in your response

Example of what NOT to say: "This book has been borrowed 10 times."
Instead focus on: "This book is titled 'Biology 101' by Dr. Smith, published in 2020."
"""
        answer_response = model.generate_content(prompt_nl)
        explanation = answer_response.text.strip()
        
        # Apply post-processing to filter out borrowing information
        explanation = filter_borrowing_info(explanation)
        
    except Exception as e:
        logger.error(f"Error generating natural language response: {e}")
        if isinstance(data, (int, float)):
            explanation = f"The answer is {data}."
        else:
            explanation = f"I found results, but encountered an error generating a natural language response."

    return {
        "explanation": explanation,
        "sql_query": display_sql_query
    } 