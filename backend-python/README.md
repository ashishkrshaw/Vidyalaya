# Vidyalaya Backend - FastAPI

## Setup

```bash
cd backend-python
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
```

## Run

```bash
uvicorn app.main:app --reload --port 8000
```

## Environment Variables

Copy `.env.example` to `.env` and fill in values.

## API Docs

After running: http://localhost:8000/docs
