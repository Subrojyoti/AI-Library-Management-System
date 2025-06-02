import logging
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.jobstores.memory import MemoryJobStore
from apscheduler.executors.asyncio import AsyncIOExecutor
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.session import AsyncSessionLocal
from app.services.email_service import (
    send_overdue_reminder_email,
    send_due_soon_reminder_email,
    email_service_conf
)
from app.crud import crud_book_issue

logger = logging.getLogger(__name__)

# Configure scheduler
scheduler = AsyncIOScheduler(
    jobstores={'default': MemoryJobStore()},
    executors={'default': AsyncIOExecutor()},
    job_defaults={'coalesce': False, 'max_instances': 1},
    timezone=timezone.utc
)

async def check_due_dates_and_send_reminders():
    """Check for overdue and due-soon books and send email reminders."""
    if not email_service_conf:
        logger.warning("Email service not configured. Skipping reminder job.")
        return

    async with AsyncSessionLocal() as db:
        try:
            today_dt = datetime.now(timezone.utc).date()
            
            # Check overdue books
            overdue_issues = await crud_book_issue.get_overdue_book_issues(db)
            for issue in overdue_issues:
                if issue.student and issue.book:
                    await send_overdue_reminder_email(
                        student_email=issue.student.email,
                        student_name=issue.student.name,
                        book_title=issue.book.title,
                        book_isbn=issue.book.isbn,
                        due_date=issue.expected_return_date.date()
                    )
            
            # Check books due soon (within next 5 days)
            due_soon_issues = await crud_book_issue.get_due_soon_book_issues(db, days_window=5)
            for issue in due_soon_issues:
                if issue.student and issue.book:
                    days_remaining = (issue.expected_return_date.date() - today_dt).days
                    await send_due_soon_reminder_email(
                        student_email=issue.student.email,
                        student_name=issue.student.name,
                        book_title=issue.book.title,
                        book_isbn=issue.book.isbn,
                        due_date=issue.expected_return_date.date(),
                        days_remaining=days_remaining
                    )
        except Exception as e:
            logger.error(f"Error during reminder check job: {e}", exc_info=True)
        finally:
            await db.close()

def initialize_scheduler():
    """Initialize and start the scheduler with the daily reminder job."""
    if not scheduler.get_job("daily_reminder_check"):
        if email_service_conf:
            # Daily job at 10 AM IST (04:30 UTC)
            scheduler.add_job(
                check_due_dates_and_send_reminders,
                'cron',
                hour=4,  # 10 AM IST = 04:30 UTC
                minute=30,
                second=0,
                id="daily_reminder_check",
                replace_existing=True
            )
            logger.info("Scheduled daily reminder job to run at 10 AM IST (04:30 UTC).")
        else:
            logger.warning("Mail server settings not configured. Email reminders will not be sent.")
    
    if not scheduler.running:
        try:
            scheduler.start()
            logger.info("Scheduler started.")
        except Exception as e:
            logger.error(f"Failed to start scheduler: {e}", exc_info=True)
    else:
        logger.info("Scheduler is already running.")

async def shutdown_scheduler():
    """Shutdown the scheduler gracefully."""
    if scheduler.running:
        scheduler.shutdown()
        logger.info("Scheduler shut down.") 