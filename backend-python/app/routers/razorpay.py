"""
Razorpay Payment Gateway Integration
Based on: https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/integration-steps/

Flow:
1. Backend creates order via Razorpay Orders API
2. Frontend opens Razorpay Checkout with order_id
3. On success, checkout returns razorpay_payment_id, razorpay_order_id, razorpay_signature
4. Backend verifies signature using HMAC-SHA256
5. Generate receipt on successful verification
"""
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
from datetime import datetime
from typing import Optional
import hmac
import hashlib

try:
    import razorpay
except ImportError:
    razorpay = None

from ..database import payments_collection, receipts_collection
from ..config import get_settings

router = APIRouter(prefix="/api/razorpay", tags=["razorpay"])
settings = get_settings()

# Razorpay Configuration
RAZORPAY_KEY_ID = getattr(settings, 'razorpay_key_id', None)
RAZORPAY_KEY_SECRET = getattr(settings, 'razorpay_key_secret', None)

# Initialize Razorpay client
razorpay_client = None
if razorpay and RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET:
    razorpay_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))


class CreateOrderRequest(BaseModel):
    amount: float  # Amount in INR (e.g., 500.00)
    student_id: str
    student_name: str
    class_name: str = ""
    section: str = ""
    parent_mobile: str = None
    parent_email: str = None
    notes: dict = None


class CreateOrderResponse(BaseModel):
    success: bool
    order_id: str = None
    razorpay_order_id: str = None
    amount: int = None  # Amount in paise
    currency: str = "INR"
    key_id: str = None
    error: str = None


class VerifyPaymentRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


class PaymentResponse(BaseModel):
    success: bool
    receipt_id: str = None
    message: str = None
    error: str = None


@router.post("/create-order", response_model=CreateOrderResponse)
async def create_razorpay_order(request: CreateOrderRequest):
    """
    Step 1: Create an order on Razorpay server
    This returns razorpay_order_id which is used by frontend checkout
    """
    if not razorpay_client:
        raise HTTPException(
            status_code=500,
            detail="Razorpay not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env"
        )
    
    try:
        # Amount must be in paise (smallest currency unit)
        amount_in_paise = int(request.amount * 100)
        
        # Generate unique order ID
        import secrets
        order_id = f"ORD_{datetime.now().strftime('%Y%m%d')}_{secrets.token_hex(4).upper()}"
        
        # Create order on Razorpay
        razorpay_order = razorpay_client.order.create({
            "amount": amount_in_paise,
            "currency": "INR",
            "receipt": order_id,
            "notes": {
                "student_id": request.student_id,
                "student_name": request.student_name,
                **(request.notes or {})
            }
        })
        
        # Store order in database
        payment_doc = {
            "order_id": order_id,
            "razorpay_order_id": razorpay_order["id"],
            "school_id": "default",  # Will be set from auth in production
            "student_id": request.student_id,
            "student_name": request.student_name,
            "class_name": request.class_name,
            "section": request.section,
            "amount": request.amount,
            "amount_paise": amount_in_paise,
            "parent_mobile": request.parent_mobile,
            "parent_email": request.parent_email,
            "status": "created",
            "created_at": datetime.utcnow()
        }
        
        await payments_collection.insert_one(payment_doc)
        
        return CreateOrderResponse(
            success=True,
            order_id=order_id,
            razorpay_order_id=razorpay_order["id"],
            amount=amount_in_paise,
            currency="INR",
            key_id=RAZORPAY_KEY_ID
        )
        
    except Exception as e:
        return CreateOrderResponse(
            success=False,
            error=str(e)
        )


@router.post("/verify-payment", response_model=PaymentResponse)
async def verify_razorpay_payment(request: VerifyPaymentRequest):
    """
    Step 5: Verify payment signature
    signature = HMAC-SHA256(razorpay_order_id + "|" + razorpay_payment_id, key_secret)
    """
    if not RAZORPAY_KEY_SECRET:
        raise HTTPException(status_code=500, detail="Razorpay not configured")
    
    try:
        # Generate signature for verification
        message = f"{request.razorpay_order_id}|{request.razorpay_payment_id}"
        generated_signature = hmac.new(
            RAZORPAY_KEY_SECRET.encode('utf-8'),
            message.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
        
        # Verify signature
        if generated_signature != request.razorpay_signature:
            return PaymentResponse(
                success=False,
                error="Invalid payment signature"
            )
        
        # Payment verified - update database
        payment = await payments_collection.find_one({
            "razorpay_order_id": request.razorpay_order_id
        })
        
        if not payment:
            return PaymentResponse(
                success=False,
                error="Order not found"
            )
        
        # Generate receipt
        from .payments import get_next_receipt_id, generate_receipt_signature
        
        school_id = payment.get("school_id", "")
        receipt_id = await get_next_receipt_id(school_id)
        
        receipt_data = {
            "receipt_id": receipt_id,
            "order_id": payment["order_id"],
            "razorpay_order_id": request.razorpay_order_id,
            "razorpay_payment_id": request.razorpay_payment_id,
            "school_id": school_id,
            "student_id": payment.get("student_id", ""),
            "student_name": payment.get("student_name", ""),
            "class_name": payment.get("class_name", ""),
            "section": payment.get("section", ""),
            "amount": payment.get("amount", 0),
            "payment_mode": "Razorpay",
            "paid_at": datetime.utcnow()
        }
        receipt_data["signature_hash"] = generate_receipt_signature(receipt_data)
        
        await receipts_collection.insert_one(receipt_data)
        
        # Update payment status
        await payments_collection.update_one(
            {"razorpay_order_id": request.razorpay_order_id},
            {"$set": {
                "status": "paid",
                "razorpay_payment_id": request.razorpay_payment_id,
                "receipt_id": receipt_id,
                "paid_at": datetime.utcnow(),
                "verified": True
            }}
        )
        
        return PaymentResponse(
            success=True,
            receipt_id=receipt_id,
            message="Payment verified successfully"
        )
        
    except Exception as e:
        return PaymentResponse(
            success=False,
            error=str(e)
        )


@router.get("/payment-status/{order_id}")
async def get_payment_status(order_id: str):
    """
    Get payment status by order_id
    """
    payment = await payments_collection.find_one({"order_id": order_id})
    
    if not payment:
        raise HTTPException(status_code=404, detail="Order not found")
    
    return {
        "order_id": payment["order_id"],
        "razorpay_order_id": payment.get("razorpay_order_id"),
        "status": payment.get("status"),
        "amount": payment.get("amount"),
        "receipt_id": payment.get("receipt_id"),
        "paid_at": payment.get("paid_at")
    }


@router.get("/test", response_class=HTMLResponse)
async def test_razorpay_checkout():
    """
    Test page for Razorpay integration
    Creates a test order and shows checkout
    """
    if not razorpay_client:
        return HTMLResponse(content="""
        <html>
        <body style="font-family: Arial; padding: 50px; text-align: center;">
            <h1>❌ Razorpay Not Configured</h1>
            <p>Add these to your .env file:</p>
            <pre style="background: #f5f5f5; padding: 20px; text-align: left; display: inline-block;">
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=your_secret_key
            </pre>
            <p>Get keys from: <a href="https://dashboard.razorpay.com/app/keys">Razorpay Dashboard</a></p>
        </body>
        </html>
        """)
    
    try:
        # Create test order
        import secrets
        test_order_id = f"TEST_{secrets.token_hex(4).upper()}"
        amount_paise = 100  # ₹1.00
        
        razorpay_order = razorpay_client.order.create({
            "amount": amount_paise,
            "currency": "INR",
            "receipt": test_order_id,
            "notes": {"test": "true"}
        })
        
        # Store in DB
        await payments_collection.insert_one({
            "order_id": test_order_id,
            "razorpay_order_id": razorpay_order["id"],
            "school_id": "test",
            "student_id": "TEST_001",
            "student_name": "Test Student",
            "amount": 1.00,
            "amount_paise": amount_paise,
            "status": "created",
            "created_at": datetime.utcnow()
        })
        
        # Return checkout page
        return HTMLResponse(content=f"""
<!DOCTYPE html>
<html>
<head>
    <title>Razorpay Test Checkout</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
    <style>
        body {{ 
            font-family: 'Segoe UI', Arial; 
            padding: 50px; 
            text-align: center; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            min-height: 100vh;
            margin: 0;
        }}
        .container {{
            background: rgba(255,255,255,0.1);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            padding: 40px;
            max-width: 500px;
            margin: 0 auto;
        }}
        button {{
            background: #528FF0;
            color: white;
            border: none;
            padding: 15px 40px;
            font-size: 18px;
            border-radius: 8px;
            cursor: pointer;
            margin-top: 20px;
        }}
        button:hover {{ background: #4070D0; }}
        .info {{ background: rgba(0,0,0,0.2); padding: 15px; border-radius: 10px; margin: 15px 0; }}
        .success {{ color: #4ade80; }}
        .error {{ color: #f87171; }}
    </style>
</head>
<body>
    <div class="container">
        <h1>🧪 Razorpay Test</h1>
        <div class="info">
            <p><strong>Order ID:</strong> {test_order_id}</p>
            <p><strong>Razorpay Order:</strong> {razorpay_order["id"]}</p>
            <p><strong>Amount:</strong> ₹1.00</p>
        </div>
        <button id="payBtn">Pay ₹1.00</button>
        <div id="result" style="margin-top: 20px;"></div>
    </div>
    
    <script>
        var options = {{
            "key": "{RAZORPAY_KEY_ID}",
            "amount": {amount_paise},
            "currency": "INR",
            "name": "Vidyalaya School",
            "description": "Test Payment",
            "order_id": "{razorpay_order["id"]}",
            "handler": async function (response) {{
                document.getElementById('result').innerHTML = '<p>Verifying payment...</p>';
                
                try {{
                    const verifyRes = await fetch('/api/razorpay/verify-payment', {{
                        method: 'POST',
                        headers: {{ 'Content-Type': 'application/json' }},
                        body: JSON.stringify({{
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature
                        }})
                    }});
                    const data = await verifyRes.json();
                    
                    if (data.success) {{
                        document.getElementById('result').innerHTML = 
                            '<p class="success">✅ Payment Successful!</p>' +
                            '<p>Receipt ID: ' + data.receipt_id + '</p>' +
                            '<p>Payment ID: ' + response.razorpay_payment_id + '</p>';
                    }} else {{
                        document.getElementById('result').innerHTML = 
                            '<p class="error">❌ Verification Failed: ' + data.error + '</p>';
                    }}
                }} catch (e) {{
                    document.getElementById('result').innerHTML = 
                        '<p class="error">❌ Error: ' + e.message + '</p>';
                }}
            }},
            "prefill": {{
                "name": "Test Student",
                "email": "test@example.com",
                "contact": "9999999999"
            }},
            "theme": {{
                "color": "#528FF0"
            }}
        }};
        
        var rzp = new Razorpay(options);
        
        rzp.on('payment.failed', function (response) {{
            document.getElementById('result').innerHTML = 
                '<p class="error">❌ Payment Failed</p>' +
                '<p>' + response.error.description + '</p>';
        }});
        
        document.getElementById('payBtn').onclick = function(e) {{
            rzp.open();
            e.preventDefault();
        }};
    </script>
</body>
</html>
        """)
        
    except Exception as e:
        return HTMLResponse(content=f"""
        <html>
        <body style="font-family: Arial; padding: 50px; text-align: center;">
            <h1>❌ Error</h1>
            <p>{str(e)}</p>
        </body>
        </html>
        """)
