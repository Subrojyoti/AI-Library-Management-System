from sqlalchemy.ext.asyncio import AsyncSession
# Import AsyncSessionLocal from database.py which is the source of truth
from app.db.database import AsyncSessionLocal

# Remove local engine and AsyncSessionLocal definitions as they are in database.py
# engine: AsyncEngine | None = None
# AsyncSessionLocal: sessionmaker[AsyncSession] | None = None

# init_db_engine and dispose_db_engine are also effectively handled by 
# create_db_and_tables and dispose_db_engine in database.py via lifespan in main.py
# So, these can be removed from here if not used elsewhere for a different purpose.

async def get_db() -> AsyncSession:
    """FastAPI dependency to get an async database session."""
    if AsyncSessionLocal is None:
        # This state should ideally not be reachable if app startup is correct
        raise RuntimeError("AsyncSessionLocal not initialized. Check database.py and app startup.")
    
    async with AsyncSessionLocal() as session:
        try:
            yield session
            # For testing, db_session fixture in conftest.py handles rollback.
            # For actual app, commit is handled by CRUD operations.
            # await session.commit() # Generally, commit within endpoints or service layer, not in dependency
        except Exception:
            # await session.rollback() # Rollback on error if not handled by endpoint/service
            raise
        finally:
            await session.close() 