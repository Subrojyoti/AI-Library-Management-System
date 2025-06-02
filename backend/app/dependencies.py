from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession

# Import AsyncSessionLocal from database.py, which is the single source of truth for session creation
from app.db.database import AsyncSessionLocal

async def get_async_db_session() -> AsyncGenerator[AsyncSession, None]:
    """
    FastAPI dependency to get an asynchronous database session.
    This is the standard session provider for most async endpoints.
    """
    if AsyncSessionLocal is None:
        raise RuntimeError(
            "AsyncSessionLocal is not initialized. Ensure database.py defines it and app startup is correct."
        )
    
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            # Consider logging the exception here
            # await session.rollback() # Rollback is good practice if an operation within the session fails
            raise # Re-raise the exception to be handled by FastAPI error handlers
        finally:
            await session.close()

async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    """
    FastAPI dependency that provides a database session.
    Currently, this provides an AsyncSession, same as get_async_db_session.
    The AI assistant service, although previously type-hinted with sync Session,
    will be refactored to use this AsyncSession with async helper functions.
    """
    if AsyncSessionLocal is None:
        raise RuntimeError(
            "AsyncSessionLocal is not initialized. Ensure database.py defines it and app startup is correct."
        )
    
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            # await session.rollback()
            raise
        finally:
            await session.close()

# Alias for common usage if other parts of the app use `get_db`
get_db = get_async_db_session 