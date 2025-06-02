# College Library Management System

This project is a backend system for managing books, students, and book insurance for a small college library, with a React frontend.

## Tech Stack

- **Backend:** FastAPI (Python)
- **Database:** PostgreSQL (Aiven Cloud)
- **ORM:** SQLAlchemy with Alembic for migrations
- **Frontend:** React (with Vite)
- **Styling:** Tailwind CSS
- **Validation:** Pydantic

## Project Structure

- `backend/`: Contains the FastAPI application.
- `frontend/`: Contains the React application.

## Setup Instructions

### Prerequisites

- Python 3.9+
- Node.js (v18+) and npm/yarn
- Access to the Aiven PostgreSQL database (credentials in `backend/.env`)
- Docker (optional, for other services or consistent dev environment)

### Backend Setup

1.  Navigate to the `backend` directory: `cd backend`
2.  Create a Python virtual environment: `python -m venv .venv`
3.  Activate the virtual environment:
    - Windows: `venv\Scripts\activate`
    - macOS/Linux: `source venv/bin/activate`
4.  Install dependencies: `pip install -r requirements.txt`
5.  Create a `.env` file in the `backend/` directory by copying `backend/.env.example`.
    **Crucially, update the `POSTGRES_PASSWORD` and other Aiven credentials if they differ from the example.**
6.  Run the FastAPI application: `uvicorn app.main:app --reload`

The API will be available at `http://localhost:8000`. Swagger docs at `http://localhost:8000/api/v1/docs`.

### Frontend Setup

1.  Navigate to the `frontend` directory: `cd frontend`
2.  Install dependencies: `npm install` (or `yarn install`)
3.  Create a `.env` file in the `frontend/` directory by copying `frontend/.env.example`.
4.  Run the development server: `npm run dev` (or `yarn dev`)

The frontend will be available at `http://localhost:5173` (or another port specified by Vite).

## API Endpoints

Refer to the Swagger documentation at `/api/v1/docs` when the backend is running.

## Overdue Tracking & Reminder System (Bonus Feature)

The system includes a bonus feature to track overdue books and send email reminders to students.

### Design & Technology

- **Scheduling:** `APScheduler` is used to run a daily job to check for overdue and due-soon books.
    - The scheduler (`AsyncIOScheduler`) is initialized and managed within the FastAPI application's lifespan events (see `app/main.py` and `app/core/scheduler.py`).
    - A single job (`check_due_dates_and_send_reminders`) is scheduled to run daily (default: 8:00 AM UTC).
- **Email Notifications:** `fastapi-mail` is used for sending HTML email reminders.
    - Email utility functions are located in `app/utils/email_utils.py`.
    - Email templates (Jinja2 HTML) are stored in the `app/templates/` directory:
        - `overdue_reminder.html`: For books that are past their due date.
        - `due_soon_reminder.html`: For books due within a configurable window (e.g., next 5 days, including today).
- **Logic:**
    - CRUD functions in `app/crud/crud_book_issue.py` (`get_overdue_book_issues`, `get_due_soon_book_issues`) identify relevant book issues.
    - The scheduled job processes these issues and triggers email sending.

### Configuration

To enable email notifications, the following environment variables must be set in your `.env` file (located in the `backend/` directory or your deployment environment):

First create an account in [Mailjet](app.mailjet.com).
Then, get the api and secret keys.
- MAIL_USERNAME=your_api_key
- MAIL_PASSWORD=your_secret_key
- MAIL_FROM=your_registered_mail
- MAIL_PORT=587
- MAIL_SERVER=in-v3.mailjet.com
- MAIL_FROM_NAME=Any Suitable Name
- TEMPLATE_FOLDER=./backend/app/email-templates


Refer to `app/core/config.py` for default values and how these settings are loaded.
If email settings are not configured, the reminder job will still run its checks but will skip sending emails and log a message to the console.


## AI Assistant (Beta)

The system includes a basic conversational AI assistant to answer common library-related questions.

### Usage

Send a `POST` request to the `/ai-assistant/webhook` endpoint with a JSON body containing your question:

```json
{
  "question": "Your question about the library goes here"
}
```

The assistant will stream back the answer using Server-Sent Events (SSE).

**Example using cURL:**

```bash
curl -X POST -H "Content-Type: application/json" -d '''{"question": "How many books are overdue?"}''' http://localhost:8000/ai-assistant/webhook --no-buffer
```

*(Note: The `--no-buffer` flag or similar might be needed in cURL or other clients to properly handle the streaming response.)*

### Supported Questions/Intents

Currently, the AI assistant can understand and respond to questions related to:

*   **Overdue Books:**
    *   "How many books are overdue?"
*   **Department Borrowing Stats:**
    *   "Which department borrowed the most books"
*   **Book Info**
    *   "Biology related books"


### Context & State

The AI assistant is currently **stateless**. Each question is processed independently, and it does not remember previous interactions or context from the same user session.

### Future Enhancements

-   Support for more complex queries.
-   (Optional) Basic context management for follow-up questions.
-   Integration with more sophisticated NLP/NLU engines if required.