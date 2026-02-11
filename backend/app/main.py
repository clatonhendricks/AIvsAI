import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import debate, providers

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

app = FastAPI(
    title="AI Debater",
    description="An AI-powered debate platform where two models argue on topics",
    version="0.1.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(providers.router, prefix="/api/providers", tags=["providers"])
app.include_router(debate.router, prefix="/api/debate", tags=["debate"])


@app.get("/")
async def root():
    return {"message": "AI Debater API", "version": "0.1.0"}


@app.get("/health")
async def health():
    return {"status": "healthy"}
