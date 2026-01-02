"""
Twilio WhatsApp Integration Router
Replaces MSG91 with Twilio for WhatsApp messaging

Features:
- Send payment reminders via WhatsApp
- Send receipt confirmations
- Uses Twilio WhatsApp Sandbox for testing
- Can switch to SMS as fallback

Twilio Setup:
1. Sign up at twilio.com
2. Get Account SID & Auth Token from console
3. For WhatsApp: Use sandbox (join by sending WhatsApp to +14155238886)
4. Add credentials to .env
"""
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

try:
    from twilio.rest import Client as TwilioClient
except ImportError:
    TwilioClient = None

from ..database import students_collection, payments_collection, receipts_collection
from ..utils.security import decode_token as jwt_decode
from ..config import get_settings

router = APIRouter(prefix="/api/whatsapp", tags=["whatsapp"])
security = HTTPBearer()
settings = get_settings()

# Twilio Configuration
TWILIO_ACCOUNT_SID = getattr(settings, 'twilio_account_sid', None)
TWILIO_AUTH_TOKEN = getattr(settings, 'twilio_auth_token', None)
TWILIO_WHATSAPP_FROM = getattr(settings, 'twilio_whatsapp_from', 'whatsapp:+14155238886')  # Sandbox number
TWILIO_SMS_FROM = getattr(settings, 'twilio_sms_from', None)  # Your Twilio phone number

# Initialize Twilio client
twilio_client = None
if TwilioClient and TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN:
    try:
        twilio_client = TwilioClient(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
    except:
        pass

async def get_school_id(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    """Extract school_id from JWT token"""
    payload = jwt_decode(credentials.credentials)
    return payload.get("sub", payload.get("school_id", ""))


# ============================================
# REQUEST/RESPONSE MODELS
# ============================================

class WhatsAppReminderRequest(BaseModel):
    student_ids: List[str]
    payment_base_url: str = "http://localhost:5173/pay"  # Frontend payment page

class SingleWhatsAppRequest(BaseModel):
    mobile: str  # Mobile with +91 prefix
    message: str
    use_sms: bool = False  # If True, send SMS instead of WhatsApp

class WhatsAppResponse(BaseModel):
    success: bool
    sent_count: int = 0
    errors: List[str] = []
    message_sids: List[str] = []


# ============================================
# WHATSAPP ENDPOINTS
# ============================================

@router.post("/send-reminders", response_model=WhatsAppResponse)
async def send_payment_reminders(request: WhatsAppReminderRequest, school_id: str = Depends(get_school_id)):
    """
    Send payment reminder WhatsApp messages to parents of selected students
    Creates payment orders and sends personalized messages with payment links
    """
    if not twilio_client:
        raise HTTPException(status_code=500, detail="Twilio not configured. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in .env")
    
    if not request.student_ids:
        raise HTTPException(status_code=400, detail="No students selected")
    
    # Get students
    students = await students_collection.find({
        "school_id": school_id,
        "studentId": {"$in": request.student_ids}
    }).to_list(None)
    
    if not students:
        raise HTTPException(status_code=404, detail="No students found")
    
    # Get school info
    from ..database import schools_collection
    from bson import ObjectId
    try:
        school = await schools_collection.find_one({"_id": ObjectId(school_id)})
    except:
        school = None
    school_name = school.get("name", "School") if school else "School"
    
    sent_count = 0
    errors = []
    message_sids = []
    
    for student in students:
        mobile = student.get("fatherMobile") or student.get("guardianMobile")
        dues = student.get("dues", 0)
        
        if not mobile:
            errors.append(f"{student.get('name', 'Unknown')}: No mobile number")
            continue
        
        if dues <= 0:
            errors.append(f"{student.get('name', 'Unknown')}: No pending dues")
            continue
        
        # Create payment order
        from .payments import generate_order_id, generate_payment_token
        from ..models.payment import PaymentOrder, PaymentStatus
        
        order_id = generate_order_id()
        payment_token = generate_payment_token()
        
        order = PaymentOrder(
            order_id=order_id,
            payment_token=payment_token,
            school_id=school_id,
            student_id=student["studentId"],
            student_name=student.get("name", "Student"),
            class_name=student.get("class", ""),
            section=student.get("section", ""),
            amount=float(dues),
            parent_mobile=mobile,
            parent_name=student.get("fatherName", "Parent"),
            status=PaymentStatus.pending,
            created_at=datetime.utcnow()
        )
        
        await payments_collection.insert_one(order.dict())
        
        # Format mobile for WhatsApp
        formatted_mobile = mobile.lstrip('+').lstrip('0')
        if not formatted_mobile.startswith('91'):
            formatted_mobile = f"91{formatted_mobile}"
        
        # Build payment link
        payment_link = f"{request.payment_base_url}/{payment_token}"
        
        # Build personalized message
        message = f"""🏫 *{school_name}*

Dear Parent of *{student.get('name', 'Student')}*
(Class: {student.get('class', '')}-{student.get('section', '')})

Your current fee dues: *₹{int(dues)}*

Pay securely now: {payment_link}

Thank you!
– {school_name}"""

        # Send via Twilio WhatsApp
        try:
            twilio_message = twilio_client.messages.create(
                body=message,
                from_=TWILIO_WHATSAPP_FROM,
                to=f"whatsapp:+{formatted_mobile}"
            )
            message_sids.append(twilio_message.sid)
            sent_count += 1
        except Exception as e:
            errors.append(f"{student.get('name', 'Unknown')}: {str(e)}")
    
    return WhatsAppResponse(
        success=sent_count > 0,
        sent_count=sent_count,
        errors=errors,
        message_sids=message_sids
    )


@router.post("/send-receipt")
async def send_receipt_whatsapp(receipt_id: str, school_id: str = Depends(get_school_id)):
    """
    Send receipt confirmation via WhatsApp after successful payment
    """
    if not twilio_client:
        raise HTTPException(status_code=500, detail="Twilio not configured")
    
    # Get receipt
    receipt = await receipts_collection.find_one({"receipt_id": receipt_id})
    if not receipt:
        raise HTTPException(status_code=404, detail="Receipt not found")
    
    # Get payment for mobile number
    payment = await payments_collection.find_one({"receipt_id": receipt_id})
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    mobile = payment.get("parent_mobile", "")
    if not mobile:
        raise HTTPException(status_code=400, detail="No mobile number")
    
    formatted_mobile = mobile.lstrip('+').lstrip('0')
    if not formatted_mobile.startswith('91'):
        formatted_mobile = f"91{formatted_mobile}"
    
    # Get school name
    from ..database import schools_collection
    from bson import ObjectId
    try:
        school = await schools_collection.find_one({"_id": ObjectId(receipt.get("school_id", ""))})
    except:
        school = None
    school_name = school.get("name", "School") if school else "School"
    
    # Build receipt message
    message = f"""✅ *Payment Confirmed!*

🏫 *{school_name}*

Student: *{receipt.get('student_name', 'Student')}*
Class: {receipt.get('class_name', '')}-{receipt.get('section', '')}
Amount Paid: *₹{int(receipt.get('amount', 0))}*
Receipt No: *{receipt_id}*
Date: {receipt.get('paid_at', datetime.utcnow()).strftime('%d-%b-%Y %I:%M %p')}

Thank you for the payment!
Keep this message as your receipt."""

    try:
        twilio_message = twilio_client.messages.create(
            body=message,
            from_=TWILIO_WHATSAPP_FROM,
            to=f"whatsapp:+{formatted_mobile}"
        )
        return {
            "success": True,
            "message_sid": twilio_message.sid,
            "sent_to": f"+{formatted_mobile}"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/send-single")
async def send_single_message(request: SingleWhatsAppRequest, school_id: str = Depends(get_school_id)):
    """
    Send a single WhatsApp or SMS message
    """
    if not twilio_client:
        raise HTTPException(status_code=500, detail="Twilio not configured")
    
    # Format mobile
    mobile = request.mobile.lstrip('+').lstrip('0')
    if not mobile.startswith('91'):
        mobile = f"91{mobile}"
    
    try:
        if request.use_sms:
            # Send SMS (requires verified number on trial)
            if not TWILIO_SMS_FROM:
                raise HTTPException(status_code=500, detail="TWILIO_SMS_FROM not configured")
            twilio_message = twilio_client.messages.create(
                body=request.message,
                from_=TWILIO_SMS_FROM,
                to=f"+{mobile}"
            )
        else:
            # Send WhatsApp
            twilio_message = twilio_client.messages.create(
                body=request.message,
                from_=TWILIO_WHATSAPP_FROM,
                to=f"whatsapp:+{mobile}"
            )
        
        return {
            "success": True,
            "message_sid": twilio_message.sid,
            "sent_to": f"+{mobile}",
            "channel": "sms" if request.use_sms else "whatsapp"
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


# ============================================
# TEST ENDPOINTS (for localhost testing)
# ============================================

class TestWhatsAppRequest(BaseModel):
    mobile: str  # Your mobile number (must have joined sandbox)
    message: str = "Hello from Vidyalaya! 🏫 This is a test message."

@router.get("/test")
async def test_twilio_config():
    """
    Test endpoint to check if Twilio is configured
    Visit: http://localhost:8000/api/whatsapp/test
    """
    return {
        "configured": twilio_client is not None,
        "account_sid_set": bool(TWILIO_ACCOUNT_SID),
        "auth_token_set": bool(TWILIO_AUTH_TOKEN),
        "whatsapp_from": TWILIO_WHATSAPP_FROM,
        "sms_from": TWILIO_SMS_FROM,
        "instructions": {
            "step1": "Sign up at https://twilio.com",
            "step2": "Get Account SID & Auth Token from console",
            "step3": "For WhatsApp: Join sandbox by sending 'join <code>' to +14155238886 via WhatsApp",
            "step4": "Add to .env: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN",
            "note": "Your phone must join the sandbox before receiving messages"
        } if not twilio_client else "Twilio is configured and ready!"
    }

@router.post("/test-send")
async def test_send_whatsapp(request: TestWhatsAppRequest):
    """
    Send a test WhatsApp message
    Does NOT require authentication - for testing only
    
    IMPORTANT: Your phone number must have joined the Twilio WhatsApp sandbox first!
    How to join: Send 'join <your-sandbox-code>' to +14155238886 via WhatsApp
    """
    if not twilio_client:
        return {
            "success": False,
            "error": "Twilio not configured",
            "setup": {
                "step1": "Sign up at https://twilio.com",
                "step2": "Get Account SID & Auth Token from console",
                "step3": "Add to .env: TWILIO_ACCOUNT_SID=ACxxxx and TWILIO_AUTH_TOKEN=xxxx",
                "step4": "Restart backend server",
                "step5": "Join WhatsApp sandbox: Send 'join <code>' to +14155238886"
            }
        }
    
    # Format mobile
    mobile = request.mobile.lstrip('+').lstrip('0')
    if not mobile.startswith('91'):
        mobile = f"91{mobile}"
    
    if len(mobile) != 12:
        return {
            "success": False,
            "error": f"Invalid mobile format. Got '{mobile}'. Expected 91XXXXXXXXXX (12 digits)"
        }
    
    try:
        message = twilio_client.messages.create(
            body=request.message,
            from_=TWILIO_WHATSAPP_FROM,
            to=f"whatsapp:+{mobile}"
        )
        
        return {
            "success": True,
            "message_sid": message.sid,
            "status": message.status,
            "sent_to": f"whatsapp:+{mobile}",
            "from": TWILIO_WHATSAPP_FROM,
            "note": "Check your WhatsApp! If not received, make sure you've joined the sandbox."
        }
    except Exception as e:
        error_msg = str(e)
        return {
            "success": False,
            "error": error_msg,
            "help": {
                "If 'not a valid whatsapp number'": "Join sandbox first: Send 'join <code>' to +14155238886",
                "If 'authentication failed'": "Check TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in .env",
                "If 'permission denied'": "Your Twilio account may need verification"
            }
        }
