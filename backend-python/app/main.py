from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers import auth, developer, students
from .routers import settings
from .routers import payments, sms, receipts, razorpay

app = FastAPI(
    title="Vidyalaya API",
    description="Backend API for Vidyalaya School Management System",
    version="1.0.0"
)

# CORS middleware - allow frontend origins
origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
    "*"  # Allow all for development
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Include routers
app.include_router(auth.router)
app.include_router(developer.router)
app.include_router(students.router)
app.include_router(settings.router)
app.include_router(payments.router)
app.include_router(sms.router)
app.include_router(receipts.router)
app.include_router(razorpay.router)

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
