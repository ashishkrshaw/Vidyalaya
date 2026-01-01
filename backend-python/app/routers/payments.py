from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from datetime import datetime
import secrets
import hashlib
import httpx
from typing import Optional

from ..database import payments_collection, receipts_collection, receipt_counters_collection, schools_collection
from ..models.payment import (
    PaymentInitiateRequest, PaymentVerifyRequest,
    PaymentOrder, PaymentStatus, Receipt,
    PaymentOrderResponse, PaymentStatusResponse, ReceiptResponse
)
from ..utils.security import decode_token as jwt_decode

router = APIRouter(prefix="/api/payments", tags=["payments"])
security = HTTPBearer()

async def get_school_id(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    """Extract school_id from JWT token"""
    payload = jwt_decode(credentials.credentials)
    return payload.get("sub", payload.get("school_id", ""))

# ============================================
# UTILITY FUNCTIONS
# ============================================

def generate_order_id() -> str:
    """Generate unique order ID: ORD-{timestamp_base36}-{random}"""
    timestamp = int(datetime.utcnow().timestamp())
    random_part = secrets.token_hex(2).upper()
    return f"ORD-{base36encode(timestamp)}-{random_part}"

def generate_payment_token() -> str:
    """Generate secure payment token for URL"""
    return secrets.token_urlsafe(32)

def base36encode(number: int) -> str:
    """Encode number to base36"""
    chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    result = ""
    while number:
        result = chars[number % 36] + result
        number //= 36
    return result or "0"

async def get_next_receipt_id(school_id: str) -> str:
    """Generate sequential receipt ID: RCP-{SCHOOL}-{YYMM}-{00001}"""
    now = datetime.utcnow()
    year_month = now.strftime("%y%m")  # e.g., "2601" for Jan 2026
    
    # Get school code (first 5 chars of school_id or name)
    school = await schools_collection.find_one({"_id": school_id})
    school_code = (school.get("name", "SCH")[:5].upper().replace(" ", "")) if school else "SCH"
    
    # Atomically increment counter
    result = await receipt_counters_collection.find_one_and_update(
        {"school_id": school_id, "year_month": year_month},
        {"$inc": {"last_number": 1}},
        upsert=True,
        return_document=True
    )
    
    seq_number = result["last_number"]
    return f"RCP-{school_code}-{year_month}-{seq_number:05d}"

def generate_receipt_signature(receipt_data: dict) -> str:
    """Generate SHA256 signature for fraud prevention - supports both Paytm and Razorpay"""
    # Use razorpay_payment_id if transaction_id not present
    txn_id = receipt_data.get('transaction_id') or receipt_data.get('razorpay_payment_id', 'NA')
    signature_string = f"{receipt_data['receipt_id']}|{receipt_data['order_id']}|{receipt_data['amount']}|{txn_id}"
    return hashlib.sha256(signature_string.encode()).hexdigest()[:16]

def verify_receipt_signature(receipt_data: dict, signature: str) -> bool:
    """Verify receipt signature"""
    expected = generate_receipt_signature(receipt_data)
    return expected == signature

# ============================================
# ENDPOINTS
# ============================================

@router.post("/initiate", response_model=PaymentOrderResponse)
async def initiate_payment(request: PaymentInitiateRequest, school_id: str = Depends(get_school_id)):
    """Create a new payment order and return payment link"""
    
    order_id = generate_order_id()
    payment_token = generate_payment_token()
    
    # Create payment order
    order = PaymentOrder(
        order_id=order_id,
        payment_token=payment_token,
        school_id=school_id,
        student_id=request.student_id,
        student_name=request.student_name,
        class_name=request.class_name,
        section=request.section,
        amount=request.amount,
        parent_mobile=request.parent_mobile,
        parent_name=request.parent_name,
        status=PaymentStatus.pending,
        created_at=datetime.utcnow()
    )
    
    await payments_collection.insert_one(order.dict())
    
    # Generate payment URL (frontend will handle this route)
    payment_url = f"/pay/{payment_token}"
    
    return PaymentOrderResponse(
        order_id=order_id,
        payment_token=payment_token,
        payment_url=payment_url,
        amount=request.amount,
        student_name=request.student_name,
        status=PaymentStatus.pending
    )

@router.get("/order/{payment_token}")
async def get_payment_by_token(payment_token: str):
    """Get payment details by token (for parent payment page)"""
    
    order = await payments_collection.find_one({"payment_token": payment_token})
    if not order:
        raise HTTPException(status_code=404, detail="Payment link not found or expired")
    
    # Get school info for display
    school = await schools_collection.find_one({"_id": order["school_id"]})
    school_name = school.get("name", "School") if school else "School"
    
    return {
        "order_id": order["order_id"],
        "student_name": order["student_name"],
        "student_id": order["student_id"],
        "class_name": order["class_name"],
        "section": order["section"],
        "amount": order["amount"],
        "status": order["status"],
        "school_name": school_name,
        "receipt_id": order.get("receipt_id"),
        "transaction_id": order.get("transaction_id"),
        "paid_at": order.get("paid_at")
    }

@router.post("/verify")
async def verify_payment(request: PaymentVerifyRequest, school_id: str = Depends(get_school_id)):
    """Verify payment after Paytm callback"""
    
    order = await payments_collection.find_one({"order_id": request.order_id, "school_id": school_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if order["status"] == PaymentStatus.success:
        return {"message": "Payment already verified", "receipt_id": order.get("receipt_id")}
    
    # Extract data from Paytm response
    paytm_data = request.paytm_response
    txn_status = paytm_data.get("STATUS", "")
    
    if txn_status == "TXN_SUCCESS":
        # Generate receipt
        receipt_id = await get_next_receipt_id(school_id)
        transaction_id = paytm_data.get("TXNID", f"TXN-{secrets.token_hex(4).upper()}")
        upi_id = paytm_data.get("VPA", None)
        payment_mode = paytm_data.get("PAYMENTMODE", "UPI")
        
        # Create receipt
        receipt_data = {
            "receipt_id": receipt_id,
            "order_id": request.order_id,
            "school_id": school_id,
            "student_id": order["student_id"],
            "student_name": order["student_name"],
            "class_name": order["class_name"],
            "section": order["section"],
            "amount": order["amount"],
            "transaction_id": transaction_id,
            "upi_id": upi_id,
            "payment_mode": payment_mode,
            "paid_at": datetime.utcnow()
        }
        receipt_data["signature_hash"] = generate_receipt_signature(receipt_data)
        
        await receipts_collection.insert_one(receipt_data)
        
        # Update payment order
        await payments_collection.update_one(
            {"order_id": request.order_id},
            {"$set": {
                "status": PaymentStatus.success,
                "paid_at": datetime.utcnow(),
                "transaction_id": transaction_id,
                "receipt_id": receipt_id,
                "upi_id": upi_id,
                "payment_mode": payment_mode,
                "bank_txn_id": paytm_data.get("BANKTXNID"),
                "gateway_response": paytm_data
            }}
        )
        
        return {
            "status": "success",
            "receipt_id": receipt_id,
            "transaction_id": transaction_id,
            "message": "Payment verified successfully"
        }
    else:
        # Payment failed
        await payments_collection.update_one(
            {"order_id": request.order_id},
            {"$set": {
                "status": PaymentStatus.failed,
                "gateway_response": paytm_data
            }}
        )
        raise HTTPException(status_code=400, detail=f"Payment failed: {paytm_data.get('RESPMSG', 'Unknown error')}")

@router.get("/status/{order_id}", response_model=PaymentStatusResponse)
async def get_payment_status(order_id: str, school_id: str = Depends(get_school_id)):
    """Check payment status"""
    
    order = await payments_collection.find_one({"order_id": order_id, "school_id": school_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    return PaymentStatusResponse(
        order_id=order["order_id"],
        status=order["status"],
        amount=order["amount"],
        student_name=order["student_name"],
        receipt_id=order.get("receipt_id"),
        transaction_id=order.get("transaction_id"),
        paid_at=order.get("paid_at")
    )

@router.get("/receipt/{receipt_id}")
async def get_receipt(receipt_id: str):
    """Get receipt details (public endpoint for parents)"""
    
    receipt = await receipts_collection.find_one({"receipt_id": receipt_id})
    if not receipt:
        raise HTTPException(status_code=404, detail="Receipt not found")
    
    # Verify signature
    is_valid = verify_receipt_signature(receipt, receipt["signature_hash"])
    
    # Get school name
    school = await schools_collection.find_one({"_id": receipt["school_id"]})
    school_name = school.get("name", "School") if school else "School"
    
    return ReceiptResponse(
        receipt_id=receipt["receipt_id"],
        student_name=receipt["student_name"],
        class_section=f"{receipt['class_name']}-{receipt['section']}",
        amount=receipt["amount"],
        transaction_id=receipt["transaction_id"],
        upi_id=receipt.get("upi_id"),
        payment_mode=receipt["payment_mode"],
        paid_at=receipt["paid_at"],
        school_name=school_name,
        is_valid=is_valid
    )

@router.get("/history")
async def get_payment_history(school_id: str = Depends(get_school_id), search: Optional[str] = None):
    """Get all payments for a school with optional search by receipt ID"""
    
    query = {"school_id": school_id, "status": PaymentStatus.success}
    
    if search:
        # Search by receipt ID or transaction ID
        query["$or"] = [
            {"receipt_id": {"$regex": search, "$options": "i"}},
            {"transaction_id": {"$regex": search, "$options": "i"}},
            {"student_name": {"$regex": search, "$options": "i"}}
        ]
    
    payments = await payments_collection.find(query).sort("paid_at", -1).to_list(100)
    
    return [{
        "order_id": p["order_id"],
        "receipt_id": p.get("receipt_id"),
        "student_name": p["student_name"],
        "student_id": p["student_id"],
        "class_section": f"{p['class_name']}-{p['section']}",
        "amount": p["amount"],
        "transaction_id": p.get("transaction_id"),
        "upi_id": p.get("upi_id"),
        "payment_mode": p.get("payment_mode"),
        "paid_at": p.get("paid_at")
    } for p in payments]

@router.post("/cancel/{order_id}")
async def cancel_payment(order_id: str, school_id: str = Depends(get_school_id)):
    """Cancel a pending payment order"""
    
    result = await payments_collection.update_one(
        {"order_id": order_id, "school_id": school_id, "status": PaymentStatus.pending},
        {"$set": {"status": PaymentStatus.cancelled}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=400, detail="Cannot cancel: payment not found or already processed")
    
    return {"message": "Payment cancelled successfully"}
