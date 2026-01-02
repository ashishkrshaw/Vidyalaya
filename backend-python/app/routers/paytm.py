"""
Paytm Integration Router
Uses official Paytm Python Sample checksum library
Flow: test.cgi -> processTransaction -> callback (response.cgi pattern)
"""
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import HTMLResponse, RedirectResponse
from pydantic import BaseModel
from datetime import datetime
from typing import Optional
import httpx

from ..database import payments_collection, receipts_collection, schools_collection
from ..config import get_settings
from ..utils import paytm_checksum as Checksum

router = APIRouter(prefix="/api/paytm", tags=["paytm"])
settings = get_settings()

# Paytm Configuration
PAYTM_MID = getattr(settings, 'paytm_mid', None)
PAYTM_MERCHANT_KEY = getattr(settings, 'paytm_merchant_key', None)
PAYTM_WEBSITE = getattr(settings, 'paytm_website', 'WEBSTAGING')
PAYTM_INDUSTRY_TYPE = 'Retail'
PAYTM_CHANNEL_ID = 'WEB'
PAYTM_CALLBACK_URL = getattr(settings, 'paytm_callback_url', 'http://localhost:8000/api/paytm/callback')
IS_STAGING = getattr(settings, 'paytm_is_staging', True)

# Paytm URLs
PAYTM_TXN_URL = "https://securegw-stage.paytm.in/theia/processTransaction" if IS_STAGING else "https://securegw.paytm.in/theia/processTransaction"
PAYTM_TXN_STATUS_URL = "https://securegw-stage.paytm.in/order/status" if IS_STAGING else "https://securegw.paytm.in/order/status"


class PaytmInitiateRequest(BaseModel):
    order_id: str
    amount: float
    cust_id: str
    mobile: Optional[str] = None
    email: Optional[str] = None


class PaytmInitiateResponse(BaseModel):
    success: bool
    html_form: str = None  # HTML form to POST to Paytm
    order_id: str = None
    error: str = None


@router.post("/initiate", response_model=PaytmInitiateResponse)
async def initiate_paytm_transaction(request: PaytmInitiateRequest):
    """
    Initiate Paytm transaction - returns HTML form for redirect
    Based on official test.cgi pattern
    """
    if not PAYTM_MID or not PAYTM_MERCHANT_KEY:
        raise HTTPException(
            status_code=500, 
            detail="Paytm not configured. Set PAYTM_MID and PAYTM_MERCHANT_KEY in .env"
        )
    
    try:
        # Prepare data dict (same as test.cgi)
        data_dict = {
            'MID': PAYTM_MID,
            'ORDER_ID': request.order_id,
            'TXN_AMOUNT': str(request.amount),
            'CUST_ID': request.cust_id,
            'INDUSTRY_TYPE_ID': PAYTM_INDUSTRY_TYPE,
            'WEBSITE': PAYTM_WEBSITE,
            'CHANNEL_ID': PAYTM_CHANNEL_ID,
            'CALLBACK_URL': PAYTM_CALLBACK_URL,
        }
        
        # Add optional fields
        if request.mobile:
            data_dict['MOBILE_NO'] = request.mobile
        if request.email:
            data_dict['EMAIL'] = request.email
        
        # Generate checksum using official library
        checksum = Checksum.generate_checksum(data_dict, PAYTM_MERCHANT_KEY)
        data_dict['CHECKSUMHASH'] = checksum
        
        # Build HTML form for POST redirect (exactly like test.cgi)
        form_html = f'''
<!DOCTYPE html>
<html>
<head>
    <title>Redirecting to Paytm...</title>
    <style>
        body {{ font-family: Arial; text-align: center; padding: 50px; background: #f5f5f5; }}
        .loader {{ border: 4px solid #f3f3f3; border-top: 4px solid #00b9f5; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 20px auto; }}
        @keyframes spin {{ 0% {{ transform: rotate(0deg); }} 100% {{ transform: rotate(360deg); }} }}
    </style>
</head>
<body>
    <div class="loader"></div>
    <h2>Redirecting to Paytm Payment Gateway...</h2>
    <p>Please wait, do not close this window.</p>
    <form method="post" action="{PAYTM_TXN_URL}" name="paytmForm" id="paytmForm">
'''
        for key, value in data_dict.items():
            form_html += f'        <input type="hidden" name="{key}" value="{value}">\n'
        
        form_html += '''
    </form>
    <script type="text/javascript">
        document.getElementById('paytmForm').submit();
    </script>
</body>
</html>
'''
        
        return PaytmInitiateResponse(
            success=True,
            html_form=form_html,
            order_id=request.order_id
        )
        
    except Exception as e:
        return PaytmInitiateResponse(
            success=False,
            error=str(e)
        )


@router.get("/checkout/{order_id}", response_class=HTMLResponse)
async def paytm_checkout_page(order_id: str):
    """
    Redirect page for Paytm checkout - fetches order and shows payment form
    """
    # Get payment order from database
    payment = await payments_collection.find_one({"order_id": order_id})
    
    if not payment:
        return HTMLResponse(content="<h1>Order not found</h1>", status_code=404)
    
    if payment.get("status") == "success":
        return HTMLResponse(content="<h1>Payment already completed</h1>", status_code=400)
    
    if not PAYTM_MID or not PAYTM_MERCHANT_KEY:
        return HTMLResponse(content="<h1>Paytm not configured</h1>", status_code=500)
    
    # Build transaction data
    data_dict = {
        'MID': PAYTM_MID,
        'ORDER_ID': order_id,
        'TXN_AMOUNT': str(payment.get("amount", 0)),
        'CUST_ID': payment.get("student_id", "CUST"),
        'INDUSTRY_TYPE_ID': PAYTM_INDUSTRY_TYPE,
        'WEBSITE': PAYTM_WEBSITE,
        'CHANNEL_ID': PAYTM_CHANNEL_ID,
        'CALLBACK_URL': PAYTM_CALLBACK_URL,
    }
    
    if payment.get("parent_mobile"):
        data_dict['MOBILE_NO'] = payment["parent_mobile"]
    
    # Generate checksum
    checksum = Checksum.generate_checksum(data_dict, PAYTM_MERCHANT_KEY)
    data_dict['CHECKSUMHASH'] = checksum
    
    # Return auto-submit form
    form_html = f'''
<!DOCTYPE html>
<html>
<head>
    <title>Redirecting to Paytm...</title>
    <style>
        body {{ font-family: 'Segoe UI', Arial; text-align: center; padding: 50px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; min-height: 100vh; margin: 0; }}
        .container {{ background: rgba(255,255,255,0.1); backdrop-filter: blur(10px); border-radius: 20px; padding: 40px; max-width: 400px; margin: 0 auto; }}
        .loader {{ border: 4px solid rgba(255,255,255,0.3); border-top: 4px solid white; border-radius: 50%; width: 50px; height: 50px; animation: spin 1s linear infinite; margin: 20px auto; }}
        @keyframes spin {{ 0% {{ transform: rotate(0deg); }} 100% {{ transform: rotate(360deg); }} }}
        h2 {{ margin-bottom: 10px; }}
        p {{ opacity: 0.8; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="loader"></div>
        <h2>Redirecting to Paytm</h2>
        <p>Amount: ₹{payment.get("amount", 0)}</p>
        <p>Order ID: {order_id}</p>
    </div>
    <form method="post" action="{PAYTM_TXN_URL}" name="paytmForm" id="paytmForm">
'''
    for key, value in data_dict.items():
        form_html += f'        <input type="hidden" name="{key}" value="{value}">\n'
    
    form_html += '''
    </form>
    <script>document.getElementById('paytmForm').submit();</script>
</body>
</html>
'''
    return HTMLResponse(content=form_html)


@router.post("/callback")
async def paytm_callback(request: Request):
    """
    Handle Paytm callback after payment
    Based on official response.cgi pattern
    """
    form_data = await request.form()
    response_dict = dict(form_data)
    
    # Extract checksum before verification
    checksum = response_dict.get('CHECKSUMHASH', '')
    
    # Handle WALLET gateway
    if response_dict.get('GATEWAYNAME') == 'WALLET':
        response_dict['BANKNAME'] = 'null'
    
    # Verify checksum using official library
    is_valid = False
    if PAYTM_MERCHANT_KEY and checksum:
        is_valid = Checksum.verify_checksum(response_dict.copy(), PAYTM_MERCHANT_KEY, checksum)
    
    order_id = response_dict.get('ORDERID', '')
    resp_code = response_dict.get('RESPCODE', '')
    resp_msg = response_dict.get('RESPMSG', 'Unknown error')
    txn_id = response_dict.get('TXNID', '')
    txn_amount = response_dict.get('TXNAMOUNT', '0')
    payment_mode = response_dict.get('PAYMENTMODE', '')
    bank_txn_id = response_dict.get('BANKTXNID', '')
    
    if is_valid and resp_code == '01':
        # Payment successful
        payment = await payments_collection.find_one({"order_id": order_id})
        
        if payment:
            # Generate receipt
            from .payments import get_next_receipt_id, generate_receipt_signature
            
            school_id = payment.get("school_id", "")
            receipt_id = await get_next_receipt_id(school_id)
            
            receipt_data = {
                "receipt_id": receipt_id,
                "order_id": order_id,
                "school_id": school_id,
                "student_id": payment.get("student_id", ""),
                "student_name": payment.get("student_name", ""),
                "class_name": payment.get("class_name", ""),
                "section": payment.get("section", ""),
                "amount": float(txn_amount),
                "transaction_id": txn_id,
                "bank_txn_id": bank_txn_id,
                "payment_mode": payment_mode,
                "paid_at": datetime.utcnow()
            }
            receipt_data["signature_hash"] = generate_receipt_signature(receipt_data)
            
            await receipts_collection.insert_one(receipt_data)
            
            await payments_collection.update_one(
                {"order_id": order_id},
                {"$set": {
                    "status": "success",
                    "paid_at": datetime.utcnow(),
                    "transaction_id": txn_id,
                    "receipt_id": receipt_id,
                    "bank_txn_id": bank_txn_id,
                    "payment_mode": payment_mode,
                    "gateway_response": response_dict
                }}
            )
            
            # Redirect to success page
            return RedirectResponse(
                url=f"/pay/success?orderId={order_id}&receiptId={receipt_id}&txnId={txn_id}&amount={txn_amount}",
                status_code=303
            )
    
    # Payment failed or checksum invalid
    if payment:
        await payments_collection.update_one(
            {"order_id": order_id},
            {"$set": {
                "status": "failed",
                "gateway_response": response_dict
            }}
        )
    
    return RedirectResponse(
        url=f"/pay/failed?orderId={order_id}&reason={resp_msg}&valid={is_valid}",
        status_code=303
    )


@router.get("/status/{order_id}")
async def get_transaction_status(order_id: str):
    """
    Get transaction status from Paytm directly
    """
    if not PAYTM_MID or not PAYTM_MERCHANT_KEY:
        raise HTTPException(status_code=500, detail="Paytm not configured")
    
    status_data = {
        'MID': PAYTM_MID,
        'ORDER_ID': order_id,
    }
    
    checksum = Checksum.generate_checksum(status_data, PAYTM_MERCHANT_KEY)
    status_data['CHECKSUMHASH'] = checksum
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                PAYTM_TXN_STATUS_URL,
                data=status_data,
                timeout=30.0
            )
            return response.json()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/test")
async def create_test_payment():
    """
    Create a test payment order for testing Paytm integration
    Visit this URL to start a test payment flow
    """
    import secrets
    
    test_order_id = f"TEST_{secrets.token_hex(4).upper()}"
    test_amount = 1.00  # Minimum amount for testing
    
    # Store test order in database
    test_order = {
        "order_id": test_order_id,
        "payment_token": secrets.token_urlsafe(16),
        "school_id": "test_school",
        "student_id": "TEST_STUDENT_001",
        "student_name": "Test Student",
        "class_name": "10",
        "section": "A",
        "amount": test_amount,
        "parent_mobile": "9999999999",
        "parent_name": "Test Parent",
        "status": "pending",
        "created_at": datetime.utcnow()
    }
    
    await payments_collection.insert_one(test_order)
    
    # Check if Paytm is configured
    if not PAYTM_MID or not PAYTM_MERCHANT_KEY:
        return {
            "status": "Paytm Not Configured",
            "message": "Add PAYTM_MID and PAYTM_MERCHANT_KEY to .env file",
            "test_order_id": test_order_id,
            "next_step": "Configure Paytm credentials first"
        }
    
    return {
        "status": "Test Order Created",
        "order_id": test_order_id,
        "amount": test_amount,
        "checkout_url": f"http://localhost:8000/api/paytm/checkout/{test_order_id}",
        "instructions": [
            f"1. Visit: http://localhost:8000/api/paytm/checkout/{test_order_id}",
            "2. You'll be redirected to Paytm's staging gateway",
            "3. Use test card: 4111111111111111, CVV: 123, OTP: 123456",
            "4. After payment, you'll be redirected back with result"
        ]
    }
