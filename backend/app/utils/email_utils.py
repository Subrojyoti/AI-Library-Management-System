from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
from pydantic import EmailStr
from typing import Dict, Any, Optional
import pathlib
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)

# Determine the base directory of the project to locate the templates folder
BASE_DIR = pathlib.Path(__file__).resolve().parent.parent # This should point to the `app` directory
TEMPLATE_DIR = BASE_DIR / "templates"

# Conditionally initialize FastMail ConnectionConfig and instance
conf: Optional[ConnectionConfig] = None
fm: Optional[FastMail] = None

if settings.MAIL_SERVER and settings.MAIL_USERNAME and settings.MAIL_PASSWORD and settings.MAIL_FROM:
    conf = ConnectionConfig(
        MAIL_USERNAME=settings.MAIL_USERNAME,
        MAIL_PASSWORD=settings.MAIL_PASSWORD,
        MAIL_FROM=settings.MAIL_FROM,
        MAIL_FROM_NAME=settings.MAIL_FROM_NAME,
        MAIL_PORT=settings.MAIL_PORT,
        MAIL_SERVER=settings.MAIL_SERVER,
        MAIL_STARTTLS=settings.MAIL_STARTTLS,
        MAIL_SSL_TLS=settings.MAIL_SSL_TLS,
        USE_CREDENTIALS=settings.MAIL_USE_CREDENTIALS,
        VALIDATE_CERTS=settings.MAIL_VALIDATE_CERTS,
        TEMPLATE_FOLDER=TEMPLATE_DIR if TEMPLATE_DIR.exists() else settings.TEMPLATE_FOLDER
    )
    fm = FastMail(conf)
    logger.info("FastMail configured in email_utils.")
else:
    logger.warning(
        "Mail server settings (MAIL_SERVER, MAIL_USERNAME, MAIL_PASSWORD, MAIL_FROM) in config are not sufficient for FastMail in email_utils. "
        "Email sending via `send_email` (using templates) will be disabled."
    )

async def send_email(
    recipient: EmailStr,
    subject: str,
    template_name: str,
    template_body: Dict[str, Any]
) -> None:
    """Send an email using a pre-defined Jinja2 template."""
    if not fm: # Check if fm was initialized
        logger.warning(f"FastMail (fm) not configured. Skipping template email to {recipient} with subject '{subject}'.")
        return

    message = MessageSchema(
        subject=subject,
        recipients=[recipient],
        template_body=template_body,
        subtype=MessageType.html 
    )

    try:
        await fm.send_message(message, template_name=template_name)
        print(f"Email sent to {recipient} with subject '{subject}'")
    except Exception as e:
        print(f"Error sending email to {recipient}: {e}")
        # Consider logging the error more formally here 

def send_email_smtp(to_email: str, subject: str, html_content: str) -> None:
    """Sends an email using SMTP configuration from settings."""
    if not settings.EMAILS_ENABLED:
        print(f"Email sending is disabled. Would send to {to_email} with subject: {subject}")
        return

    msg = MIMEMultipart()
    msg['From'] = settings.EMAILS_FROM_EMAIL
    msg['To'] = to_email
    msg['Subject'] = subject
    msg.attach(MIMEText(html_content, 'html'))

    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            if settings.SMTP_TLS:
                server.starttls()
            if settings.SMTP_USER and settings.SMTP_PASSWORD:
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.EMAILS_FROM_EMAIL, to_email, msg.as_string())
        print(f"Email sent successfully to {to_email}")
    except Exception as e:
        print(f"Error sending email to {to_email}: {e}")
        # Depending on requirements, you might want to raise the exception
        # or log it more formally. 