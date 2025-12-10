"""Main FastAPI application entry point."""

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import SQLAlchemyError
from dotenv import load_dotenv

from middleware.error_handler import (
    validation_exception_handler,
    database_exception_handler,
    generic_exception_handler,
)
from utils.logger import get_logger

# Load environment variables
load_dotenv()

# Initialize logger
logger = get_logger("main")

# Create FastAPI app
app = FastAPI(
    title="Physical AI & Humanoid Robotics API",
    description="Backend API for AI-Native Textbook",
    version="1.0.0",
)

# Configure CORS
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register exception handlers
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(SQLAlchemyError, database_exception_handler)
app.add_exception_handler(Exception, generic_exception_handler)

# Import and register routes
from routes import health, chat

app.include_router(health.router, tags=["health"])
app.include_router(chat.router, tags=["chat"])

# Future routes (will be added in later phases)
# from routes import auth, translate, personalize
# app.include_router(auth.router, prefix="/auth", tags=["auth"])
# app.include_router(translate.router, prefix="/translate", tags=["translate"])
# app.include_router(personalize.router, prefix="/personalize", tags=["personalize"])


@app.on_event("startup")
async def startup_event():
    """Initialize services on startup."""
    logger.info("Starting Physical AI & Humanoid Robotics API")
    logger.info(f"CORS origins: {CORS_ORIGINS}")


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown."""
    logger.info("Shutting down Physical AI & Humanoid Robotics API")


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Physical AI & Humanoid Robotics API",
        "version": "1.0.0",
        "status": "running",
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
