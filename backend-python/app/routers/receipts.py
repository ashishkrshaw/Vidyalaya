from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from io import BytesIO
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_RIGHT
from datetime import datetime

from ..database import receipts_collection, schools_collection

router = APIRouter(prefix="/api/receipts", tags=["receipts"])

@router.get("/{receipt_id}/pdf")
async def generate_receipt_pdf(receipt_id: str):
    """Generate PDF receipt for download"""
    
    # Get receipt
    receipt = await receipts_collection.find_one({"receipt_id": receipt_id})
    if not receipt:
        raise HTTPException(status_code=404, detail="Receipt not found")
    
    # Get school info
    school = await schools_collection.find_one({"_id": receipt["school_id"]})
    school_name = school.get("name", "School") if school else "School"
    school_address = school.get("address", "") if school else ""
    school_phone = school.get("phone", "") if school else ""
    
    # Create PDF
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=20*mm, leftMargin=20*mm, topMargin=20*mm, bottomMargin=20*mm)
    
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle('Title', parent=styles['Heading1'], fontSize=20, alignment=TA_CENTER, textColor=colors.HexColor('#4f46e5'))
    subtitle_style = ParagraphStyle('Subtitle', parent=styles['Normal'], fontSize=10, alignment=TA_CENTER, textColor=colors.gray)
    header_style = ParagraphStyle('Header', parent=styles['Normal'], fontSize=12, alignment=TA_CENTER, spaceAfter=5)
    label_style = ParagraphStyle('Label', parent=styles['Normal'], fontSize=10, textColor=colors.gray)
    value_style = ParagraphStyle('Value', parent=styles['Normal'], fontSize=12, fontName='Helvetica-Bold')
    
    elements = []
    
    # Header
    elements.append(Paragraph(school_name, title_style))
    if school_address:
        elements.append(Paragraph(school_address, subtitle_style))
    if school_phone:
        elements.append(Paragraph(f"Phone: {school_phone}", subtitle_style))
    elements.append(Spacer(1, 10*mm))
    
    # Receipt Title
    elements.append(Paragraph("FEE RECEIPT", ParagraphStyle('ReceiptTitle', parent=styles['Heading2'], fontSize=16, alignment=TA_CENTER, textColor=colors.HexColor('#22c55e'))))
    elements.append(Spacer(1, 5*mm))
    
    # Receipt Info Table
    paid_at = receipt.get("paid_at")
    if isinstance(paid_at, datetime):
        date_str = paid_at.strftime("%d-%b-%Y %I:%M %p")
    else:
        date_str = str(paid_at) if paid_at else "N/A"
    
    info_data = [
        [Paragraph("Receipt No:", label_style), Paragraph(receipt["receipt_id"], value_style)],
        [Paragraph("Date:", label_style), Paragraph(date_str, value_style)],
        [Paragraph("Transaction ID:", label_style), Paragraph(receipt.get("transaction_id", "N/A"), value_style)],
    ]
    
    info_table = Table(info_data, colWidths=[100, 200])
    info_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ]))
    elements.append(info_table)
    elements.append(Spacer(1, 8*mm))
    
    # Student Info
    elements.append(Paragraph("Student Details", header_style))
    student_data = [
        ["Name", receipt["student_name"]],
        ["Class", f"{receipt['class_name']} - {receipt['section']}"],
        ["Student ID", receipt["student_id"]],
    ]
    student_table = Table(student_data, colWidths=[100, 300])
    student_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f3f4f6')),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (1, 0), (1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 11),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.lightgrey),
    ]))
    elements.append(student_table)
    elements.append(Spacer(1, 8*mm))
    
    # Payment Details
    elements.append(Paragraph("Payment Details", header_style))
    payment_data = [
        ["Amount Paid", f"₹ {receipt['amount']:,.2f}"],
        ["Payment Mode", receipt.get("payment_mode", "UPI")],
        ["UPI ID", receipt.get("upi_id", "N/A") or "N/A"],
    ]
    payment_table = Table(payment_data, colWidths=[100, 300])
    payment_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f3f4f6')),
        ('BACKGROUND', (1, 0), (1, 0), colors.HexColor('#dcfce7')),  # Amount row green bg
        ('TEXTCOLOR', (1, 0), (1, 0), colors.HexColor('#166534')),   # Amount text green
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (1, 0), (1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 11),
        ('FONTSIZE', (1, 0), (1, 0), 14),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.lightgrey),
    ]))
    elements.append(payment_table)
    elements.append(Spacer(1, 10*mm))
    
    # Signature Section
    elements.append(Paragraph("_" * 30, ParagraphStyle('Sig', alignment=TA_RIGHT)))
    elements.append(Paragraph("Authorized Signature", ParagraphStyle('SigLabel', alignment=TA_RIGHT, fontSize=9, textColor=colors.gray)))
    elements.append(Spacer(1, 8*mm))
    
    # Digital Signature Hash (fraud prevention)
    elements.append(Paragraph(f"Digital Signature: {receipt.get('signature_hash', 'N/A')}", ParagraphStyle('Hash', fontSize=8, textColor=colors.lightgrey, alignment=TA_CENTER)))
    elements.append(Paragraph("This is a computer-generated receipt. No physical signature required.", ParagraphStyle('Note', fontSize=8, textColor=colors.gray, alignment=TA_CENTER)))
    
    # Build PDF
    doc.build(elements)
    buffer.seek(0)
    
    # Return as downloadable file
    filename = f"Receipt_{receipt_id}.pdf"
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
