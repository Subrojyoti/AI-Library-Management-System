from sqlalchemy.ext.asyncio import AsyncSession # Keep if used, but likely not in this file

# Import the engine from the session management module
from app.db.session import engine # MODIFIED

# Import the common Base for all models
from app.db.base_class import Base # MODIFIED

# Import all model modules/classes to ensure they are registered with Base.metadata
# These imports are crucial for Base.metadata.create_all to know about the tables if this script were used for setup.
# from app.models.book import Book # noqa (Temporarily commented out)
# from app.models.student import Student # noqa (Temporarily commented out)
# from app.models.issue import BookIssue # noqa (Temporarily commented out)
# NOTE: Model registration is now handled by app/db/__init__.py
# So, explicit model imports here are not strictly necessary if app.db has been imported.

async def create_database_tables():
    """Creates all database tables defined by SQLAlchemy models using the common Base."""
    if not engine:
        print("Database engine not initialized in session.py. Skipping table creation.")
        return

    async with engine.begin() as conn:
        # This will create all tables that inherit from the common Base
        await conn.run_sync(Base.metadata.create_all)
    print("All database tables checked/created using common Base.")

# This file is primarily for table creation logic.
# The get_session for FastAPI dependencies is in app.db.session.py.

# Example of how this might be called at startup (e.g., in main.py or lifespan event):
# from app.db.init_db import create_database_tables
# await create_database_tables() 