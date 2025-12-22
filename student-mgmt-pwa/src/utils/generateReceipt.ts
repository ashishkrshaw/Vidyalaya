import jsPDF from 'jspdf';
import QRCode from 'qrcode';

interface FeeReceiptItem {
  description: string;
  amount: number;
}

interface FeeReceiptData {
  student: {
    name: string;
    class: string;
    section: string;
    rollNo: string | number;
    studentId: string;
    fatherName: string;
  };
  receiptNo: string;
  date: string;
  months: string[];
  items: FeeReceiptItem[];
  totalAmount: number;
  schoolInfo: {
    name: string;
    address: string;
    phone: string;
    email: string;
    website: string;
    logo?: string;
    principalSignature?: string;
  };
}

export const generateFeeReceipt = async (data: FeeReceiptData) => {
  const { student, receiptNo, date, items, totalAmount, schoolInfo } = data;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = 210;
  const margin = 15;
  let y = 15;

  // --- Helper: Centered Text ---
  const centerText = (text: string, yPos: number, size: number = 10, bold: boolean = false) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(size);
    doc.text(text, pageWidth / 2, yPos, { align: 'center' });
  };

  // --- Header ---
  // School Logo
  if (schoolInfo.logo && schoolInfo.logo.startsWith('data:')) {
    try {
      doc.addImage(schoolInfo.logo, 'PNG', margin, y, 25, 25);
    } catch (e) {}
  }

  // School Name & Details
  doc.setTextColor(30, 58, 138); // Navy Blue
  doc.setFont('times', 'bold');
  doc.setFontSize(22);
  doc.text(schoolInfo.name.toUpperCase(), margin + 30, y + 8);
  
  doc.setTextColor(100);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(schoolInfo.address, margin + 30, y + 15);
  doc.text(`Phone: ${schoolInfo.phone} | Email: ${schoolInfo.email}`, margin + 30, y + 20);

  y += 35;

  // Title with lines
  doc.setDrawColor(30, 58, 138);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  
  doc.setFillColor(240, 249, 255); // Light Blue bg
  doc.rect(margin, y, pageWidth - (margin * 2), 10, 'F');
  
  doc.setTextColor(30, 58, 138);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('FEE RECEIPT', pageWidth / 2, y + 7, { align: 'center' });
  
  doc.line(margin, y + 10, pageWidth - margin, y + 10);
  y += 18;

  // --- Receipt Info ---
  doc.setTextColor(0);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`Receipt No: ${receiptNo}`, margin, y);
  doc.text(`Date: ${date}`, pageWidth - margin - 40, y);
  y += 10;

  // --- Student Details Box ---
  const boxHeight = 35;
  doc.setDrawColor(200);
  doc.setFillColor(252, 252, 252);
  doc.roundedRect(margin, y, pageWidth - (margin * 2), boxHeight, 3, 3, 'FD');

  const col1 = margin + 5;
  const col2 = margin + 80;
  let rowY = y + 8;

  // Row 1
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  doc.text('Student Name:', col1, rowY);
  doc.setTextColor(0);
  doc.setFont('helvetica', 'bold');
  doc.text(student.name, col1 + 30, rowY);

  doc.setTextColor(100);
  doc.setFont('helvetica', 'normal');
  doc.text('Class/Sec:', col2, rowY);
  doc.setTextColor(0);
  doc.setFont('helvetica', 'bold');
  doc.text(`${student.class} - ${student.section}`, col2 + 25, rowY);
  rowY += 8;

  // Row 2
  doc.setTextColor(100);
  doc.setFont('helvetica', 'normal');
  doc.text('Father Name:', col1, rowY);
  doc.setTextColor(0);
  doc.setFont('helvetica', 'bold');
  doc.text(student.fatherName, col1 + 30, rowY);

  doc.setTextColor(100);
  doc.setFont('helvetica', 'normal');
  doc.text('Roll No:', col2, rowY);
  doc.setTextColor(0);
  doc.setFont('helvetica', 'bold');
  doc.text(String(student.rollNo), col2 + 25, rowY);
  rowY += 8;

  // Row 3
  doc.setTextColor(100);
  doc.setFont('helvetica', 'normal');
  doc.text('Student ID:', col1, rowY);
  doc.setTextColor(0);
  doc.setFont('helvetica', 'bold');
  doc.text(student.studentId, col1 + 30, rowY);
  
  y += boxHeight + 15;

  // --- Payment Table ---
  // Header
  const tableH = 10;
  doc.setFillColor(30, 58, 138); // Header Blue
  doc.rect(margin, y, pageWidth - (margin * 2), tableH, 'F');
  
  doc.setTextColor(255);
  doc.setFont('helvetica', 'bold');
  doc.text('Description', margin + 5, y + 7);
  doc.text('Amount (₹)', pageWidth - margin - 5, y + 7, { align: 'right' });
  
  y += tableH;

  // Rows
  doc.setTextColor(0);
  doc.setFont('helvetica', 'normal');
  let altRow = false;

  items.forEach(item => {
    if (altRow) {
      doc.setFillColor(249, 250, 251);
      doc.rect(margin, y, pageWidth - (margin * 2), 10, 'F');
    }
    
    doc.text(item.description, margin + 5, y + 7);
    doc.text(item.amount.toLocaleString('en-IN'), pageWidth - margin - 5, y + 7, { align: 'right' });
    doc.setDrawColor(240);
    doc.line(margin, y + 10, pageWidth - margin, y + 10); // Bottom border
    
    y += 10;
    altRow = !altRow;
  });

  // Total Row
  y += 2;
  doc.setFillColor(240, 253, 244); // Green tint
  doc.setDrawColor(34, 197, 94);
  doc.roundedRect(margin, y, pageWidth - (margin * 2), 12, 1, 1, 'FD');
  
  doc.setTextColor(21, 128, 61); // Dark Green
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL AMOUNT PAID', margin + 5, y + 8);
  doc.text(`₹ ${totalAmount.toLocaleString('en-IN')}/-`, pageWidth - margin - 5, y + 8, { align: 'right' });
  
  y += 25;

  // --- Footer / Signatures ---
  const sigY = 240; // Fixed key position at bottom
  
  // Scannable QR Code
  try {
    const qrData = JSON.stringify({
      receiptNo,
      studentId: student.studentId,
      amount: totalAmount,
      date,
      school: schoolInfo.name
    });
    const qrUrl = await QRCode.toDataURL(qrData, { margin: 1 });
    doc.addImage(qrUrl, 'PNG', margin, sigY, 25, 25);
    
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text('Scan to verify', margin + 12.5, sigY + 28, { align: 'center' });
  } catch (e) {}

  // Auth Signatory
  doc.setDrawColor(0);
  doc.setLineWidth(0.3);
  doc.line(pageWidth - margin - 50, sigY + 20, pageWidth - margin, sigY + 20);
  
  // Principal Signature
  if (schoolInfo.principalSignature) {
    try {
      doc.addImage(schoolInfo.principalSignature, 'PNG', pageWidth - margin - 40, sigY, 30, 15);
    } catch (e) {}
  }
  
  doc.setFontSize(9);
  doc.setTextColor(0);
  doc.setFont('helvetica', 'bold');
  doc.text('Authorized Signatory / Principal', pageWidth - margin - 25, sigY + 25, { align: 'center' });

  // Footer Note
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text('This is a computer generated receipt. No signature is required.', pageWidth / 2, 280, { align: 'center' });
  doc.text(`${schoolInfo.website}`, pageWidth / 2, 285, { align: 'center' });

  // Save
  doc.save(`FeeReceipt_${student.name}_${receiptNo}.pdf`);
};
