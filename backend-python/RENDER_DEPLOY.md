# Render Deployment Guide for Vidyalaya Backend

## Step 1: Push to GitHub
Make sure your `backend-python` folder is in a GitHub repository.

## Step 2: Create render.yaml (already done below)

## Step 3: Go to Render
1. Go to https://render.com and sign up/login
2. Click **New +** → **Web Service**
3. Connect your GitHub repository
4. Select the `backend-python` folder

## Step 4: Configure on Render Dashboard

### Basic Settings:
- **Name**: `vidyalaya-api`
- **Region**: Singapore (closest to India)
- **Branch**: `main`
- **Root Directory**: `backend-python` (if in subfolder)
- **Runtime**: Python 3
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### Environment Variables (Set in Render Dashboard):
```
MONGODB_URL=mongodb+srv://YOUR_USER:YOUR_PASS@cluster.mongodb.net/vidyalaya
JWT_SECRET=your-super-secret-key-change-this
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=10080
DEVELOPER_SECRET=your-developer-secret
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=xxxxx
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
```

## Step 5: Deploy
Click **Create Web Service** - Render will build and deploy.

## Step 6: Get Your Backend URL
After deployment, you'll get a URL like:
```
https://vidyalaya-api.onrender.com
```

## Step 7: Set Frontend Environment
In your frontend deployment (Vercel/Netlify), add:
```
VITE_API_URL=https://vidyalaya-api.onrender.com
```

Or create `.env.production` in frontend:
```
VITE_API_URL=https://vidyalaya-api.onrender.com
```

---

## CORS is Already Configured ✅
Your `app/main.py` already has:
```python
origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "*"  # Allow all origins
]
```

This allows ALL origins, so any frontend URL will work.

---

## Quick Test After Deployment
Visit: `https://your-render-url.onrender.com/health`
Should return: `{"status": "healthy"}`
