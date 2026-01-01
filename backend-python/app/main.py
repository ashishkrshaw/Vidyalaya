from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers import auth, developer

app = FastAPI(
    title="Vidyalaya API",
    description="Backend API for Vidyalaya School Management System",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Update with specific origins in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(developer.router)

@app.get("/")
async def root():
    return {
        "message": "Vidyalaya API is running!",
        "docs": "/docs",
        "version": "1.0.0"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
