# backend/app/db/database.py
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

# Import the db package to ensure all models are registered with Base.metadata
# This replaces the previous commented-out direct model imports.
# import app.db
# from app.db.base_class import Base # Base is needed for Base.metadata.create_all
from app.db import Base

# Commented out model imports are no longer needed here as app.db handles it
# # import app.models.book # noqa
# import app.models.student # noqa
# import app.models.issue # noqa
# If you have an app.models.__init__.py that imports all models,
# you could potentially just import app.models here.

# Create an async engine instance
# The engine is typically defined here and imported by main.py or session.py
engine = create_async_engine(
    str(settings.DATABASE_URL),
    pool_pre_ping=True,
    echo=settings.DB_ECHO, # Set to True in .env for SQL logging
)

# Create a session factory
AsyncSessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

async def create_db_and_tables():
    """
    Creates all tables in the database.
    This function is typically called at application startup.
    All SQLAlchemy models are now registered by importing `app.db` above.
    """
    # Base should be imported at the module level. No need to import here again.
    # from app.db.base_class import Base 
    # from app.db import Base # This is already available in module scope
    async with engine.begin() as conn:
        # await conn.run_sync(Base.metadata.drop_all) # Use with caution: drops all data!
        await conn.run_sync(Base.metadata.create_all)
    print("Database tables created (if they didn't exist).")

async def dispose_db_engine():
    """
    Disposes of the database engine.
    This function is typically called at application shutdown.
    """
    await engine.dispose()
    print("Database engine disposed.")

# If app.db.session.get_db is meant to be here:
# from typing import AsyncGenerator
# async def get_db() -> AsyncGenerator[AsyncSession, None]:
#     async with AsyncSessionLocal() as session:
#         try:
#             yield session
#         finally:
#             await session.close()

# Note: The `get_db` dependency is usually in `app.db.session.py`.
# `app.main.py` imports `create_db_and_tables, engine, dispose_db_engine` from `app.db.database`. 