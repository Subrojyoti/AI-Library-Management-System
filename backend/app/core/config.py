import os
import logging
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import PostgresDsn, field_validator, Field
from typing import Any
from pathlib import Path
import sys

# Determine the project root directory based on the current file's location
# This assumes config.py is in backend/app/core/
# So, project_root is three levels up (backend folder)
PROJECT_ROOT_ENV_FILE = Path(__file__).resolve().parent.parent.parent / ".env"

# Configure basic logging for debug messages
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# --- BEGIN DEBUG LOGS ---
# logger.debug(f"[config.py] Calculated .env path: {PROJECT_ROOT_ENV_FILE}")
# logger.debug(f"[config.py] Does .env file exist? {PROJECT_ROOT_ENV_FILE.exists()}")
# logger.debug(f"[config.py] os.environ.get('POSTGRES_USER'): {os.environ.get('POSTGRES_USER')}")
# logger.debug(f"[config.py] os.environ.get('POSTGRES_PASSWORD'): {os.environ.get('POSTGRES_PASSWORD')}")
# logger.debug(f"[config.py] os.environ.get('POSTGRES_SERVER'): {os.environ.get('POSTGRES_SERVER')}")
# logger.debug(f"[config.py] os.environ.get('POSTGRES_PORT'): {os.environ.get('POSTGRES_PORT')}")
# logger.debug(f"[config.py] os.environ.get('POSTGRES_DB'): {os.environ.get('POSTGRES_DB')}")
# logger.debug(f"[config.py] os.environ.get('POSTGRES_SSL_MODE'): {os.environ.get('POSTGRES_SSL_MODE')}")
# logger.debug(f"[config.py] os.environ.get('DATABASE_URL'): {os.environ.get('DATABASE_URL')}")
# --- END DEBUG LOGS ---

class Settings(BaseSettings):
    PROJECT_NAME: str = "College Library Management System"
    API_V1_STR: str = "/api/v1"

    # Database settings
    POSTGRES_USER: str = Field(default="user")
    POSTGRES_PASSWORD: str = Field(default="password")
    POSTGRES_SERVER: str = Field(default="localhost")
    POSTGRES_PORT: str = Field(default="5432")
    POSTGRES_DB: str = Field(default="app")
    POSTGRES_SSL_MODE: str | None = Field(default=None)
    DB_ECHO: bool = Field(default=False)
    DATABASE_URL: PostgresDsn | None = None

    # Email settings for reminders
    MAIL_USERNAME: str | None = Field(default=None)
    MAIL_PASSWORD: str | None = Field(default=None)
    MAIL_FROM: str | None = Field(default=None)
    MAIL_FROM_NAME: str | None = Field(default="College Library")
    MAIL_PORT: int = Field(default=587)
    MAIL_SERVER: str | None = Field(default=None)
    MAIL_STARTTLS: bool = Field(default=True)
    MAIL_SSL_TLS: bool = Field(default=False)
    MAIL_USE_CREDENTIALS: bool = Field(default=True)
    MAIL_VALIDATE_CERTS: bool = Field(default=True)
    TEMPLATE_FOLDER: str | None = Field(default=None)

    # Reminder settings
    DUE_SOON_WINDOW_DAYS: int = Field(default=5)  # Start sending reminders 5 days before due date
    REMINDER_JOB_HOUR: int = Field(default=9)     # Run reminder check at 9 AM UTC

    # AI Assistant settings
    GEMINI_API_KEY: str | None = Field(default="YOUR_GEMINI_API_KEY_HERE")

    model_config = SettingsConfigDict(env_file=PROJECT_ROOT_ENV_FILE, env_file_encoding='utf-8', extra='ignore')

    @field_validator("DATABASE_URL", mode="before")
    def assemble_db_connection(cls, v: str | None, values: dict[str, Any]) -> Any:
        if isinstance(v, str):
            return v
        return PostgresDsn.build(
            scheme="postgresql+asyncpg",
            username=values.data.get("POSTGRES_USER"),
            password=values.data.get("POSTGRES_PASSWORD"),
            host=values.data.get("POSTGRES_SERVER"),
            port=int(values.data.get("POSTGRES_PORT", 5432)),
            path=f"{values.data.get('POSTGRES_DB') or ''}",
        )

settings = Settings()

# --- BEGIN CRITICAL DEBUG CHECK ---
# We need to import sys here if it's not already imported for sys.path
import sys 
if not PROJECT_ROOT_ENV_FILE.exists(): # Ensure this line is active
    raise FileNotFoundError( # Ensure this block is active
        f"CRITICAL DEBUG: .env file NOT FOUND at {PROJECT_ROOT_ENV_FILE}. "
        f"Current working directory: {os.getcwd()}" # Added os.getcwd()
    )

# Check if POSTGRES_USER is still the Pydantic default
if settings.POSTGRES_USER == "user": # Default Pydantic value
    # This log will now be visible thanks to pytest.ini log_cli settings
    logger.error(
        f"CRITICAL LOG: settings.POSTGRES_USER is still the default ('{settings.POSTGRES_USER}'). "
        f".env file at {PROJECT_ROOT_ENV_FILE} (exists: {PROJECT_ROOT_ENV_FILE.exists()}) was likely NOT LOADED by Pydantic. "
        f"PYTHONPATH: {os.environ.get('PYTHONPATH', 'Not set')}, "
        f"sys.path: {sys.path}"
    )
    # Optionally, re-raise to halt tests if .env is critical and not loaded
    # raise ValueError("Halting tests: .env not loaded, POSTGRES_USER is default.") 
# --- END CRITICAL DEBUG CHECK ---

# --- BEGIN DEBUG LOGS ---
# logger.debug(f"[config.py] Loaded settings.model_dump(): {settings.model_dump()}")
# logger.debug(f"[config.py] Final DATABASE_URL: {settings.DATABASE_URL}")
# --- END DEBUG LOGS --- 