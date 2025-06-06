from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from starlette.middleware.base import BaseHTTPMiddleware

from app.db.database import create_db_and_tables, engine, dispose_db_engine
from app.routers.book_routes import router as books_router
from app.routers.student_routes import router as students_router
from app.routers.book_issue_routes import router as issues_router
from app.routers.ai_assistant.ai_assistant_routes import router as ai_assistant_router
from app.routers.health_check import router as health_router
from app.routers.stats_routes import router as stats_router
from app.core.scheduler import initialize_scheduler, scheduler
from app.core.config import settings

# Custom middleware to add CORS headers to every response manually
class CORSMiddlewareManual(BaseHTTPMiddleware):
    allowed_origins = {"http://localhost:5173", "https://ai-library-management-system.vercel.app", "https://ai-library-management-system-frontend.vercel.app"}
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        origin = request.headers.get("origin")
        
        # Add CORS headers to every response, including error responses
        # Check if origin exists and is in allowed_origins before setting the header
        if origin and origin in self.allowed_origins:
            response.headers["Access-Control-Allow-Origin"] = origin
        else:
            # Default to a safe value or first allowed origin if no matching origin found
            response.headers["Access-Control-Allow-Origin"] = next(iter(self.allowed_origins))
            
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Allow-Methods"] = "*"
        response.headers["Access-Control-Allow-Headers"] = "*"
        
        # Handle preflight requests
        if request.method == "OPTIONS":
            response.headers["Access-Control-Max-Age"] = "600"
            
        return response

@asynccontextmanager
async def lifespan(app_instance: FastAPI):
    # Startup
    print("Starting up application...")

    # For now, create_db_and_tables handles its own engine context.
    await create_db_and_tables() # Create tables using the function from database.py
    print("Database tables checked/created.")
    initialize_scheduler() # Initialize and start the scheduler
    print("Scheduler initialized.")
    yield
    # Shutdown
    print("Shutting down application...")
    if scheduler.running:
        scheduler.shutdown(wait=False)
        print("Scheduler shut down.")
    await dispose_db_engine() # Dispose of the engine
    print("Database engine disposed.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="API for managing a college library system.",
    version="0.1.0",
    lifespan=lifespan,
    openapi_url=f"{settings.API_V1_STR}/openapi.json" # Ensure OpenAPI spec is under API_V1_STR
)

# Add manual CORS middleware - this should be the first middleware
app.add_middleware(CORSMiddlewareManual)

# Standard CORS middleware - keeping this as well for compatibility
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "https://ai-library-management-system.vercel.app", "https://ai-library-management-system-frontend.vercel.app"],  # Frontend origins
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
    expose_headers=["*"],  # Optional: expose headers to the browser
    max_age=600,  # Caching preflight requests for 10 minutes
)

# Global exception handler to ensure CORS headers are applied even when errors occur
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    # Log the exception here if needed
    if hasattr(exc, "status_code"):
        status_code = exc.status_code
    else:
        status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
    
    if hasattr(exc, "detail"):
        detail = exc.detail
    else:
        detail = str(exc)
    
    response = JSONResponse(
        status_code=status_code,
        content={"detail": detail}
    )
    
    # Manually add CORS headers to the error response as well
    origin = request.headers.get("origin")
    if origin and origin in ["http://localhost:5173", "https://ai-library-management-system.vercel.app", "https://ai-library-management-system-frontend.vercel.app"]:
        response.headers["Access-Control-Allow-Origin"] = origin
    else:
        response.headers["Access-Control-Allow-Origin"] = "https://ai-library-management-system.vercel.app"
    response.headers["Access-Control-Allow-Credentials"] = "true"
    
    return response

# Include routers with API_V1_STR prefix
app.include_router(health_router, prefix=f"{settings.API_V1_STR}/health", tags=["Health Check"])
app.include_router(books_router, prefix=f"{settings.API_V1_STR}/books", tags=["Books"])
app.include_router(students_router, prefix=f"{settings.API_V1_STR}/students", tags=["Students"])
app.include_router(issues_router, prefix=f"{settings.API_V1_STR}/issues", tags=["Book Issues"])
app.include_router(ai_assistant_router, prefix=f"{settings.API_V1_STR}/ai-assistant", tags=["AI Assistant"])
app.include_router(stats_router, prefix=f"{settings.API_V1_STR}/stats", tags=["Statistics"])

# Handle OPTIONS requests explicitly
@app.options("/{full_path:path}")
async def options_handler(request: Request, full_path: str):
    response = JSONResponse(content={})
    return response

# An API root endpoint under the v1 prefix
@app.get(f"{settings.API_V1_STR}", tags=["Root"], summary="API v1 Root Path")
async def read_api_v1_root():
    return {"message": f"Welcome to the {settings.PROJECT_NAME} API v1"}



# A general root endpoint, not included in the main API schema for v1 if docs are specific to /api/v1
@app.get("/", tags=["Root"], summary="Application Root Path", include_in_schema=False)
async def read_application_root():
    return {"message": f"Welcome to {settings.PROJECT_NAME}. API v1 is available at {settings.API_V1_STR}"}
