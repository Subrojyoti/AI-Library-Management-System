import google.generativeai as genai
from typing import List, Any
from ..core.config import settings

# Database schema for context
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

2. students:
   - id (integer, primary key)
   - name (text)
   - roll_number (text)
   - department (text)
   - semester (integer)
   - phone (text)
   - email (text)

3. book_issue:
   - id (integer, primary key)
   - book_id (integer, foreign key to books.id)
   - student_id (integer, foreign key to students.id)
   - issue_date (date)
   - expected_return_date (date)
   - actual_return_date (date)
   - is_returned (boolean)
"""

async def generate_sql_query(question: str) -> str:
    """
    Generate an SQL query based on the user's question using Gemini API.
    Only SELECT queries are allowed for security.
    """
    model = genai.GenerativeModel('gemini-1.5-flash')
    
    prompt = f"""Given the following database schema:
    {DB_SCHEMA}
    
    Generate a SQL query to answer this question: {question}
    
    Important:
    1. Only generate SELECT queries
    2. Make sure the query is safe and efficient
    3. Include proper JOINs when needed
    4. Use appropriate WHERE clauses
    5. Format the query for readability
    """
    
    response = model.generate_content(prompt)
    sql_query = response.text.strip()
    
    # Security check - ensure it's a SELECT query
    if not sql_query.upper().startswith("SELECT"):
        raise ValueError("Only SELECT queries are allowed")
    
    return sql_query

async def generate_natural_response(question: str, results: List[Any]) -> str:
    """
    Generate a natural language response based on the query results using Gemini API.
    """
    model = genai.GenerativeModel('gemini-1.5-flash')
    
    # Convert results to a readable format
    results_str = str(results)
    
    prompt = f"""Given the following question and query results:
    Question: {question}
    Results: {results_str}
    
    Provide a natural, conversational response that:
    1. Directly answers the question
    2. Includes relevant data from the results
    3. Is clear and easy to understand
    4. Maintains a professional but friendly tone
    """
    
    response = model.generate_content(prompt)
    return response.text.strip() 