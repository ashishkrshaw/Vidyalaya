from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import List, Optional
import httpx
from datetime import datetime

from ..database import students_collection, payments_collection
from ..utils.security import decode_token as jwt_decode
from ..config import get_settings

router = APIRouter(prefix="/api/sms", tags=["sms"])
security = HTTPBearer()
settings = get_settings()

# MSG91 Configuration
MSG91_AUTH_KEY = getattr(settings, 'msg91_auth_key', None)
MSG91_SENDER_ID = getattr(settings, 'msg91_sender_id', 'SCHOOL')
MSG91_FLOW_API_URL = "https://api.msg91.com/api/v5/flow/"

async def get_school_id(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    """Extract school_id from JWT token"""
    payload = jwt_decode(credentials.credentials)
    return payload.get("sub", payload.get("school_id", ""))

class SMSBulkRequest(BaseModel):
    student_ids: List[str]
    template_id: str  # MSG91 Flow/Template ID (DLT approved)

class SingleSMSRequest(BaseModel):
    mobile: str
    template_id: str
    variables: dict  # e.g., {"VAR1": "value1", "VAR2": "value2"}

class SMSResponse(BaseModel):
    success: bool
    sent_count: int = 0
    errors: List[str] = []
    msg91_response: Optional[dict] = None

@router.post("/send-payment-links", response_model=SMSResponse)
async def send_payment_links_bulk(request: SMSBulkRequest, school_id: str = Depends(get_school_id)):
    """
    Send payment links to multiple parents via MSG91 Flow API
    
    MSG91 Flow API Documentation:
    - Endpoint: https://api.msg91.com/api/v5/flow/
    - Method: POST
    - Headers: authkey, Content-Type: application/json
    - Body: flow_id (template_id), sender, recipients array with variables
    
    Template variables use ##VAR1##, ##VAR2## format in MSG91 dashboard
    """
    
    if not MSG91_AUTH_KEY:
        raise HTTPException(status_code=500, detail="MSG91 not configured. Set MSG91_AUTH_KEY in environment.")
    
    if not request.student_ids:
        raise HTTPException(status_code=400, detail="No students selected")
    
    # Get students with pending dues
    students = await students_collection.find({
        "school_id": school_id,
        "studentId": {"$in": request.student_ids}
    }).to_list(None)
    
    if not students:
        raise HTTPException(status_code=404, detail="No students found")
    
    # Get school info for SMS
    from ..database import schools_collection
    from bson import ObjectId
    try:
        school = await schools_collection.find_one({"_id": ObjectId(school_id)})
    except:
        school = None
    school_name = school.get("name", "School") if school else "School"
    
    # Prepare recipients and create payment orders
    recipients = []
    errors = []
    
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
        
        # Format mobile (ensure country code for India)
        formatted_mobile = mobile.lstrip('+').lstrip('0')
        if not formatted_mobile.startswith('91'):
            formatted_mobile = f"91{formatted_mobile}"
        
        # Build payment link - replace with your actual domain
        payment_link = f"https://yourschool.com/pay/{payment_token}"
        
        # MSG91 recipient format with template variables
        # Variables map to ##VAR1##, ##VAR2##, ##VAR3## etc in template
        recipients.append({
            "mobiles": formatted_mobile,
            "VAR1": student.get("name", "Student"),           # Student name
            "VAR2": str(int(dues)),                           # Amount
            "VAR3": payment_link,                              # Payment link
            "VAR4": f"{student.get('class', '')}-{student.get('section', '')}",  # Class
            "VAR5": school_name                                # School name
        })
    
    if not recipients:
        return SMSResponse(success=False, sent_count=0, errors=errors)
    
    # Send via MSG91 Flow API
    try:
        payload = {
            "flow_id": request.template_id,
            "sender": MSG91_SENDER_ID,
            "recipients": recipients
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                MSG91_FLOW_API_URL,
                headers={
                    "authkey": MSG91_AUTH_KEY,
                    "Content-Type": "application/json"
                },
                json=payload,
                timeout=30.0
            )
            
            msg91_response = response.json()
            
            # MSG91 returns {"type": "success"} on success
            if response.status_code == 200 and msg91_response.get("type") == "success":
                return SMSResponse(
                    success=True,
                    sent_count=len(recipients),
                    errors=errors,
                    msg91_response=msg91_response
                )
            else:
                errors.append(f"MSG91 Error: {msg91_response.get('message', 'Unknown error')}")
                return SMSResponse(
                    success=False,
                    sent_count=0,
                    errors=errors,
                    msg91_response=msg91_response
                )
                
    except httpx.RequestError as e:
        errors.append(f"Network error: {str(e)}")
        return SMSResponse(success=False, sent_count=0, errors=errors)

@router.post("/send-single")
async def send_single_sms(request: SingleSMSRequest, school_id: str = Depends(get_school_id)):
    """
    Send a single SMS using MSG91 Flow API
    Useful for sending receipt confirmations
    """
    if not MSG91_AUTH_KEY:
        raise HTTPException(status_code=500, detail="MSG91 not configured")
    
    # Format mobile
    formatted_mobile = request.mobile.lstrip('+').lstrip('0')
    if not formatted_mobile.startswith('91'):
        formatted_mobile = f"91{formatted_mobile}"
    
    # Build recipient with variables
    recipient = {"mobiles": formatted_mobile}
    recipient.update(request.variables)
    
    payload = {
        "flow_id": request.template_id,
        "sender": MSG91_SENDER_ID,
        "recipients": [recipient]
    }
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                MSG91_FLOW_API_URL,
                headers={
                    "authkey": MSG91_AUTH_KEY,
                    "Content-Type": "application/json"
                },
                json=payload,
                timeout=30.0
            )
            
            return {"success": response.status_code == 200, "response": response.json()}
            
    except httpx.RequestError as e:
        raise HTTPException(status_code=500, detail=f"Failed to send SMS: {str(e)}")

@router.post("/send-receipt")
async def send_receipt_sms(
    receipt_id: str, 
    template_id: str,
    school_id: str = Depends(get_school_id)
):
    """
    Send receipt confirmation SMS to parent after successful payment
    """
    if not MSG91_AUTH_KEY:
        raise HTTPException(status_code=500, detail="MSG91 not configured")
    
    from ..database import receipts_collection
    
    receipt = await receipts_collection.find_one({"receipt_id": receipt_id, "school_id": school_id})
    if not receipt:
        raise HTTPException(status_code=404, detail="Receipt not found")
    
    # Get parent mobile from payment order
    payment = await payments_collection.find_one({"receipt_id": receipt_id})
    if not payment:
        raise HTTPException(status_code=404, detail="Payment order not found")
    
    mobile = payment.get("parent_mobile", "")
    if not mobile:
        raise HTTPException(status_code=400, detail="No mobile number found")
    
    formatted_mobile = mobile.lstrip('+').lstrip('0')
    if not formatted_mobile.startswith('91'):
        formatted_mobile = f"91{formatted_mobile}"
    
    payload = {
        "flow_id": template_id,
        "sender": MSG91_SENDER_ID,
        "recipients": [{
            "mobiles": formatted_mobile,
            "VAR1": receipt_id,                    # Receipt ID
            "VAR2": str(int(receipt["amount"])),   # Amount
            "VAR3": receipt["student_name"],       # Student name
            "VAR4": receipt.get("transaction_id", "N/A")  # Transaction ID
        }]
    }
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                MSG91_FLOW_API_URL,
                headers={
                    "authkey": MSG91_AUTH_KEY,
                    "Content-Type": "application/json"
                },
                json=payload,
                timeout=30.0
            )
            
            return {"success": response.status_code == 200, "response": response.json()}
            
    except httpx.RequestError as e:
        raise HTTPException(status_code=500, detail=f"Failed to send SMS: {str(e)}")


# ============================================
# TEST ENDPOINTS (for localhost testing)
# ============================================

class TestSMSRequest(BaseModel):
    mobile: str  # Phone number to send test SMS
    template_id: str  # MSG91 template/flow ID
    test_message: str = "Test"  # Will be used as VAR1

@router.get("/test")
async def test_msg91_config():
    """
    Test endpoint to check if MSG91 is configured
    Visit: http://localhost:8000/api/sms/test
    """
    return {
        "configured": MSG91_AUTH_KEY is not None,
        "auth_key_set": bool(MSG91_AUTH_KEY),
        "sender_id": MSG91_SENDER_ID,
        "flow_api_url": MSG91_FLOW_API_URL,
        "instructions": {
            "step1": "Get AUTH_KEY from https://control.msg91.com/app/settings/api-settings",
            "step2": "Create SMS template at https://control.msg91.com/app/sms/templates",
            "step3": "Get template/flow_id after DLT approval",
            "step4": "Add to .env: MSG91_AUTH_KEY=your_key and MSG91_SENDER_ID=VIDSMS"
        } if not MSG91_AUTH_KEY else "MSG91 is configured and ready!"
    }

@router.post("/test-send")
async def test_send_sms(request: TestSMSRequest):
    """
    Send a test SMS to verify MSG91 integration
    Does NOT require authentication - for testing only
    
    Usage:
    POST /api/sms/test-send
    {
        "mobile": "9876543210",
        "template_id": "your_template_flow_id",
        "test_message": "Hello from Vidyalaya!"
    }
    """
    if not MSG91_AUTH_KEY:
        return {
            "success": False,
            "error": "MSG91 not configured",
            "help": {
                "step1": "Get AUTH_KEY from https://control.msg91.com/app/settings/api-settings",
                "step2": "Add to .env: MSG91_AUTH_KEY=your_auth_key_here",
                "step3": "Restart the backend server"
            }
        }
    
    # Format mobile number
    mobile = request.mobile.lstrip('+').lstrip('0')
    if not mobile.startswith('91'):
        mobile = f"91{mobile}"
    
    # Validate mobile length (10 digits + country code)
    if len(mobile) != 12:
        return {
            "success": False,
            "error": f"Invalid mobile number format. Got '{mobile}' (length {len(mobile)}). Expected 91XXXXXXXXXX"
        }
    
    payload = {
        "flow_id": request.template_id,
        "sender": MSG91_SENDER_ID,
        "recipients": [{
            "mobiles": mobile,
            "VAR1": request.test_message,
            "VAR2": "Test",
            "VAR3": "http://localhost:8000",
            "VAR4": "Test Class",
            "VAR5": "Vidyalaya School"
        }]
    }
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                MSG91_FLOW_API_URL,
                headers={
                    "authkey": MSG91_AUTH_KEY,
                    "Content-Type": "application/json"
                },
                json=payload,
                timeout=30.0
            )
            
            msg91_response = response.json()
            
            return {
                "success": response.status_code == 200 and msg91_response.get("type") == "success",
                "status_code": response.status_code,
                "msg91_response": msg91_response,
                "sent_to": mobile,
                "template_id": request.template_id,
                "payload_sent": payload
            }
            
    except httpx.RequestError as e:
        return {
            "success": False,
            "error": f"Network error: {str(e)}"
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

