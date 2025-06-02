# backend/app/services/email_service.py
import logging
from pathlib import Path
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
from pydantic import EmailStr
from typing import List, Dict, Any, Optional
from datetime import date, datetime
from jinja2 import Environment, FileSystemLoader

from backend.app.core.config import settings

logger = logging.getLogger(__name__)

# Initialize email service configuration
email_service_conf: Optional[ConnectionConfig] = None
jinja_env: Optional[Environment] = None

def format_date(value, fmt):
    """Format a date value using the given format string."""
    if isinstance(value, (datetime, date)):
        return value.strftime(fmt)
    elif value == "now":
        return datetime.now().strftime(fmt)
    return str(value)

if all([
    settings.MAIL_USERNAME,
    settings.MAIL_PASSWORD,
    settings.MAIL_FROM,
    settings.MAIL_SERVER,
    settings.TEMPLATE_FOLDER
]):
    # Configure Jinja2 environment with date filter
    template_folder = Path(settings.TEMPLATE_FOLDER).resolve()
    jinja_env = Environment(loader=FileSystemLoader(template_folder))
    jinja_env.filters['date'] = format_date

    email_service_conf = ConnectionConfig(
        MAIL_USERNAME=settings.MAIL_USERNAME,
        MAIL_PASSWORD=settings.MAIL_PASSWORD,
        MAIL_FROM=settings.MAIL_FROM,
        MAIL_PORT=settings.MAIL_PORT,
        MAIL_SERVER=settings.MAIL_SERVER,
        MAIL_FROM_NAME=settings.MAIL_FROM_NAME,
        MAIL_STARTTLS=settings.MAIL_STARTTLS,
        MAIL_SSL_TLS=settings.MAIL_SSL_TLS,
        USE_CREDENTIALS=settings.MAIL_USE_CREDENTIALS,
        VALIDATE_CERTS=settings.MAIL_VALIDATE_CERTS,
        TEMPLATE_FOLDER=template_folder,
        SUPPRESS_SEND=0
    )
    logger.info("Email service configured.")
else:
    logger.warning("Mail server settings not configured. Email service will not be available.")

async def send_email(
    recipients: List[EmailStr],
    subject: str,
    template_name: str,
    template_body: Dict[str, Any]
) -> None:
    """Send an email using a template."""
    if not email_service_conf or not jinja_env:
        logger.error("Email service not configured. Cannot send email.")
        return

    # Add current date for templates that use it
    template_body['now'] = datetime.now()

    # Render the template using Jinja2
    template = jinja_env.get_template(template_name)
    html_content = template.render(**template_body)

    message = MessageSchema(
        subject=subject,
        recipients=recipients,
        body=html_content,  # Use rendered HTML content
        subtype=MessageType.html
    )

    fm = FastMail(email_service_conf)
    try:
        await fm.send_message(message)
        logger.info(f"Email sent to {recipients} with subject '{subject}'")
    except Exception as e:
        logger.error(f"Error sending email: {e}")

async def send_overdue_reminder_email(
    student_email: EmailStr,
    student_name: str,
    book_title: str,
    book_isbn: str,
    due_date: date
) -> None:
    """Send an overdue book reminder email."""
    subject = f"Overdue Book Reminder: {book_title}"
    template_body = {
        "student_name": student_name,
        "book_title": book_title,
        "book_isbn": book_isbn,
        "due_date": due_date.strftime("%Y-%m-%d"),
        "current_date": date.today().strftime("%Y-%m-%d")
    }
    await send_email(
        recipients=[student_email],
        subject=subject,
        template_name="overdue_reminder.html",
        template_body=template_body
    )

async def send_due_soon_reminder_email(
    student_email: EmailStr,
    student_name: str,
    book_title: str,
    book_isbn: str,
    due_date: date,
    days_remaining: int
) -> None:
    """Send a due soon reminder email."""
    subject = f"Book Due Soon Reminder: {book_title}"
    template_body = {
        "student_name": student_name,
        "book_title": book_title,
        "book_isbn": book_isbn,
        "due_date": due_date.strftime("%Y-%m-%d"),
        "days_remaining": days_remaining
    }
    await send_email(
        recipients=[student_email],
        subject=subject,
        template_name="due_soon_reminder.html",
        template_body=template_body
    ) 