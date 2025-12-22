"""
School Chatbot Lambda - SIMPLE VERSION
No DynamoDB, No extra costs - Just Gemini API
Works 100% within AWS Free Tier
"""

import json
import os
import re
import urllib.request

# Only need Gemini API key
GEMINI_KEY = os.environ.get('GEMINI_API_KEY', '')


def call_gemini(query: str, ctx: dict) -> str:
    """Call Gemini API - FREE tier: 60 requests/min"""
    if not GEMINI_KEY:
        return None
    
    # Limit data sent (keep payload small)
    ctx_small = {
        'schoolName': ctx.get('schoolName', 'School'),
        'totalStudents': ctx.get('totalStudents', 0),
        'totalFeeCollected': ctx.get('totalFeeCollected', 0),
        'pendingDues': ctx.get('pendingDues', 0),
    }
    
    # Add only first 30 students (smaller = faster = cheaper)
    students = ctx.get('students', [])
    if students:
        ctx_small['students'] = students[:30]
    
    prompt = f"""School assistant. Data:
{json.dumps(ctx_small, default=str)}

Q: {query}
Brief answer:"""

    try:
        req = urllib.request.Request(
            f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={GEMINI_KEY}",
            data=json.dumps({
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {"temperature": 0.7, "maxOutputTokens": 300}
            }).encode(),
            headers={'Content-Type': 'application/json'},
            method='POST'
        )
        with urllib.request.urlopen(req, timeout=10) as res:
            return json.loads(res.read())['candidates'][0]['content']['parts'][0]['text']
    except Exception as e:
        print(f"Gemini error: {e}")
        return None


def local_response(q: str, ctx: dict) -> str:
    """Fast local response - no API call needed"""
    ql = q.lower()
    students = ctx.get('students', [])
    total = ctx.get('totalStudents', len(students))
    fees = ctx.get('totalFeeCollected', 0)
    dues = ctx.get('pendingDues', 0)
    name = ctx.get('schoolName', 'School')
    
    # Student count
    if 'how many' in ql and 'student' in ql:
        return f"📊 {name} has {total} students."
    
    if 'total' in ql and 'student' in ql:
        return f"📊 Total students: {total}"
    
    # Find student by name
    if any(w in ql for w in ['find', 'search', 'who is', 'details']):
        for s in students:
            sn = str(s.get('name', '')).lower()
            if sn and sn in ql:
                return f"""👤 {s.get('name')}
• ID: {s.get('studentId')} | Class: {s.get('class')}-{s.get('section')}
• Roll: {s.get('rollNo')} | DOB: {s.get('dob', '-')}
• Father: {s.get('fatherName', '-')}
• Mobile: {s.get('fatherMobile', '-')}
• Paid: ₹{s.get('paidTotal', 0):,} | Due: ₹{s.get('dues', 0):,}"""
    
    # List by class
    if 'list' in ql and 'class' in ql:
        m = re.search(r'class\s*(\d+|nursery|kg)', ql, re.I)
        if m:
            tc = m.group(1)
            cs = [s for s in students if str(s.get('class', '')).lower() == tc.lower()]
            if cs:
                lst = '\n'.join([f"• {s['name']} (Roll {s.get('rollNo', '-')})" for s in cs[:10]])
                extra = f"\n...+{len(cs)-10} more" if len(cs) > 10 else ""
                return f"📚 Class {tc.upper()}: {len(cs)} students\n{lst}{extra}"
            return f"No students in Class {tc}"
    
    # Fees
    if 'fee' in ql or 'payment' in ql or 'collect' in ql:
        if 'pending' in ql or 'due' in ql:
            ps = [s for s in students if float(s.get('dues', 0)) > 0]
            if ps and 'who' in ql:
                lst = '\n'.join([f"• {s['name']}: ₹{s['dues']:,.0f}" for s in ps[:5]])
                return f"💰 Students with dues ({len(ps)}):\n{lst}"
            return f"💰 Pending: ₹{dues:,.0f}"
        return f"💰 Collected: ₹{fees:,.0f}"
    
    # Greetings
    if any(w in ql for w in ['hi', 'hello', 'hey']):
        return f"👋 Hi! I'm {name} assistant. Ask me anything!"
    
    if 'help' in ql:
        return """🎓 I can help with:
• "How many students?"
• "Find student [name]"  
• "List class 10 students"
• "Show pending dues"
• "Total fee collected" """
    
    # Default - try Gemini if available
    return None


def lambda_handler(event, context):
    """Main handler - API Gateway compatible"""
    
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    }
    
    # Handle CORS preflight
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': headers, 'body': ''}
    
    try:
        body = json.loads(event.get('body') or '{}')
        query = body.get('query', '').strip()
        ctx = body.get('schoolContext', {})
        
        if not query:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({'error': 'Query required'})
            }
        
        # Try local response first (FREE, instant)
        response = local_response(query, ctx)
        source = 'local'
        
        # If no local match and Gemini key exists, use API
        if not response and GEMINI_KEY:
            response = call_gemini(query, ctx)
            source = 'gemini'
        
        # Fallback
        if not response:
            name = ctx.get('schoolName', 'School')
            total = ctx.get('totalStudents', 0)
            response = f"""📚 {name}: {total} students
Try: "How many students?", "Find [name]", "List class 10" """
            source = 'fallback'
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({
                'response': response,
                'source': source
            })
        }
        
    except Exception as e:
        print(f"Error: {e}")
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': str(e)})
        }


# ============================================
# SETUP (Super Simple):
# ============================================
# 1. Create Lambda: Python 3.12, paste this code
# 2. Add env var: GEMINI_API_KEY = your-key
# 3. Create API Gateway: HTTP API, POST /chat
# 4. Set Lambda timeout: 15 seconds
# 5. Update Chatbot.tsx with your API URL
#
# COST: $0 (Free tier covers everything)
# - Lambda: 1M free requests/month
# - API Gateway: 1M free requests/month  
# - Gemini: 60 free requests/min
# ============================================
