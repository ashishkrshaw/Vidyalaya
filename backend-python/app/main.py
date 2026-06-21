from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers import auth, developer, students
from .routers import settings
from .routers import payments, whatsapp, receipts, razorpay, mfa

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
    "https://edisapp.onrender.com",
    "https://nlkh.duckdns.org",
    "https://scholarbase-phep.onrender.com",
]



app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=[
        "Content-Type",
        "Authorization",
        "x-developer-secret",
        "Accept",
        "Origin",
        "X-Requested-With",
    ],
    expose_headers=["*"]
)


# Include routers
app.include_router(auth.router)
app.include_router(developer.router)
app.include_router(students.router)
app.include_router(settings.router)
app.include_router(payments.router)
app.include_router(whatsapp.router)
app.include_router(receipts.router)
app.include_router(razorpay.router)
app.include_router(mfa.router)

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
