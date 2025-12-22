# AWS Lambda Chatbot Setup Guide

## Prerequisites
- AWS Account with Lambda & DynamoDB access
- Google AI Studio account (for Gemini API key)
- Node.js 18+ (for frontend)

---

## 1. Get Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Click **"Create API Key"**
3. Copy the key (starts with `AIza...`)

---

## 2. Create DynamoDB Table

### AWS Console:
1. Go to **DynamoDB** → **Create Table**
2. Configure:
   ```
   Table Name: SchoolChatbotCache
   Partition Key: pk (String)
   Sort Key: sk (String)
   ```
3. **Settings** → Default settings → **Create Table**
4. After creation → **Additional Settings** → **Time to Live (TTL)**:
   - Enable TTL
   - TTL attribute: `ttl`

### AWS CLI:
```bash
aws dynamodb create-table \
  --table-name SchoolChatbotCache \
  --attribute-definitions \
    AttributeName=pk,AttributeType=S \
    AttributeName=sk,AttributeType=S \
  --key-schema \
    AttributeName=pk,KeyType=HASH \
    AttributeName=sk,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST

# Enable TTL
aws dynamodb update-time-to-live \
  --table-name SchoolChatbotCache \
  --time-to-live-specification Enabled=true,AttributeName=ttl
```

---

## 3. Create Lambda Function

### Step 1: Create Function
1. Go to **Lambda** → **Create Function**
2. Choose:
   - Function name: `school-chatbot`
   - Runtime: `Python 3.12`
   - Architecture: `x86_64`
3. Click **Create Function**

### Step 2: Add Code
1. In Lambda editor, replace all code with contents of:
   ```
   lambda/school_chatbot.py
   ```
2. Click **Deploy**

### Step 3: Configure Environment Variables
Go to **Configuration** → **Environment Variables** → **Edit**:

| Key | Value |
|-----|-------|
| `GEMINI_API_KEY` | Your Gemini API key |
| `DYNAMODB_TABLE` | `SchoolChatbotCache` |

### Step 4: Add IAM Permissions
Go to **Configuration** → **Permissions** → Click role link → **Add permissions**:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:Query"
      ],
      "Resource": "arn:aws:dynamodb:*:*:table/SchoolChatbotCache"
    }
  ]
}
```

### Step 5: Set Timeout
Go to **Configuration** → **General Configuration** → **Edit**:
- Timeout: `30 seconds`
- Memory: `256 MB`

---

## 4. Create API Gateway

### Step 1: Create HTTP API
1. Go to **API Gateway** → **Create API**
2. Choose **HTTP API** → **Build**
3. Add Lambda integration → Select `school-chatbot`
4. Name: `school-chatbot-api`

### Step 2: Configure Routes
Add route:
- Method: `POST`
- Path: `/chat`
- Integration: `school-chatbot`

### Step 3: Enable CORS
Go to **CORS** → Configure:
- Access-Control-Allow-Origin: `*`
- Access-Control-Allow-Methods: `POST, OPTIONS`
- Access-Control-Allow-Headers: `Content-Type`

### Step 4: Get API URL
Copy the **Invoke URL** (looks like):
```
https://abc123xyz.execute-api.us-east-1.amazonaws.com
```

---

## 5. Update Frontend

### Edit `src/Chatbot.tsx`:
Find line 11 and update:
```typescript
const LAMBDA_API_URL = 'https://YOUR-API-ID.execute-api.REGION.amazonaws.com/chat';
```

---

## 6. Test

### Test with curl:
```bash
curl -X POST https://YOUR-API.execute-api.us-east-1.amazonaws.com/chat \
  -H "Content-Type: application/json" \
  -d '{
    "query": "How many students?",
    "schoolContext": {
      "schoolId": "test123",
      "schoolName": "Test School",
      "totalStudents": 450,
      "totalFeeCollected": 250000,
      "pendingDues": 50000,
      "students": []
    }
  }'
```

### Expected Response:
```json
{
  "response": "📊 Test School has 450 students enrolled.",
  "remaining": 24,
  "source": "offline",
  "isLiveTime": false,
  "timestamp": "2024-12-22T13:20:00"
}
```

---

## Chatbot Behavior

| Time (IST) | Behavior |
|------------|----------|
| **10:00am - 12:00pm** | Live Gemini API call + saves to DynamoDB |
| **Other times** | Uses cached responses from DynamoDB |

### Daily Limit
- 25 queries per school per day
- Resets at midnight IST
- Shows warning when limit reached

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| 500 Error | Check Lambda logs in CloudWatch |
| CORS Error | Verify API Gateway CORS settings |
| No Response | Check GEMINI_API_KEY is valid |
| Timeout | Increase Lambda timeout to 30s |
| DynamoDB Error | Verify IAM permissions |

---

## Cost Estimate (Monthly)

| Service | Free Tier | Paid |
|---------|-----------|------|
| Lambda | 1M requests free | $0.20/1M |
| DynamoDB | 25GB + 25 WCU/RCU free | ~$1/month |
| API Gateway | 1M requests free | $1/1M |
| **Gemini API** | 60 req/min free | Check pricing |

For a school with <1000 students and ~100 queries/day: **Usually FREE**
