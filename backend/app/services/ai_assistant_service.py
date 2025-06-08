import google.generativeai as genai
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, Any, List, Optional, Tuple, Callable, AsyncGenerator
import json
import logging
import datetime
import uuid
import re
from sqlalchemy import select, func, or_, text

from app.core.config import settings
from app.models.book import Book
from app.models.student import Student
from app.models.book_issue import BookIssue as Issue
from app.services.library_analytics_service import library_analytics_service

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

# # Simple in-memory store for conversation histories
# conversation_contexts: Dict[str, List[LLMContent]] = {}

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