from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime
from enum import Enum

class PaymentStatus(str, Enum):
    pending = "pending"
    processing = "processing"
    success = "success"
    failed = "failed"
    cancelled = "cancelled"

# Request Models
class PaymentInitiateRequest(BaseModel):
    student_id: str
    student_name: str
    class_name: str
    section: str
    amount: float = Field(..., gt=0)
    parent_mobile: str = Field(..., min_length=10, max_length=15)
    parent_name: Optional[str] = None

class PaymentVerifyRequest(BaseModel):
    order_id: str
    paytm_response: dict  # Raw Paytm callback data

# Database Models
class PaymentOrder(BaseModel):
    order_id: str
    payment_token: str  # Unique token for payment link
    school_id: str
    student_id: str
    student_name: str
    class_name: str
    section: str
    amount: float
    parent_mobile: str
    parent_name: Optional[str] = None
    status: PaymentStatus = PaymentStatus.pending
    created_at: datetime = Field(default_factory=datetime.utcnow)
    paid_at: Optional[datetime] = None
    # Payment details (filled after success)
    transaction_id: Optional[str] = None
    receipt_id: Optional[str] = None
    upi_id: Optional[str] = None
    bank_txn_id: Optional[str] = None
    payment_mode: Optional[str] = None  # UPI, CARD, NETBANKING
    gateway_response: Optional[dict] = None

class Receipt(BaseModel):
    receipt_id: str  # RCP-SCHOOL-YYMM-00001
    order_id: str
    school_id: str
    student_id: str
    student_name: str
    class_name: str
    section: str
    amount: float
    transaction_id: str
    upi_id: Optional[str] = None
    payment_mode: str
    paid_at: datetime
    created_at: datetime = Field(default_factory=datetime.utcnow)
    # Digital signature for fraud prevention
    signature_hash: str

class ReceiptCounter(BaseModel):
    """Tracks sequential receipt numbers per school per month"""
    school_id: str
    year_month: str  # Format: YYMM (e.g., 2601 for Jan 2026)
    last_number: int = 0

# Response Models
class PaymentOrderResponse(BaseModel):
    order_id: str
    payment_token: str
    payment_url: str
    amount: float
    student_name: str
    status: PaymentStatus

class PaymentStatusResponse(BaseModel):
    order_id: str
    status: PaymentStatus
    amount: float
    student_name: str
    receipt_id: Optional[str] = None
    transaction_id: Optional[str] = None
    paid_at: Optional[datetime] = None

class ReceiptResponse(BaseModel):
    receipt_id: str
    student_name: str
    class_section: str
    amount: float
    transaction_id: str
    upi_id: Optional[str]
    payment_mode: str
    paid_at: datetime
    school_name: str
    is_valid: bool  # Signature verification result
