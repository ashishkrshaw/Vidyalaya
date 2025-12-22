# Fee Payment Process & Data Flow

## 1. Current Workflow (FeeManagement.tsx)

### Step 1: Search Student
- user selects Class, Section, Roll No
- `handleSearch()` calls `getAdmissionsByClassSection()`
- Finds student -> `setStudent(found)`

### Step 2: Select Months
- User toggles months (April-March)
- `total` calculator updates based on `feeMap` (Monthly Fee * Count)

### Step 3: Payment Execution (`handlePay`)
1. **History Log**: Calls `addHistoryEntry()`
   - Action: `fee_payment`
   - Details: Amount, Months, Student Info
2. **Database Update**: Calls `addFeePayment(studentId, payment)`
   - Updates `feeHistory` array in `student` object
   - Updates `dues` (Old dues - Paid Amount)
3. **UI Refresh**:
   - Refetches student data to show updated dues
   - Clears selection
4. **Receipt Generation**:
   - Sets `receiptData`
   - Opens Receipt Dialog (`receiptOpen = true`)

## 2. Database Functions (db.ts)

### `addFeePayment(studentId, payment)`
- Gets student from `admissions` store
- Appends new payment to `feeHistory`
- Updates `dues` field
- Saves back to DB

### `addHistoryEntry(entry)`
- Adds a new record to `history` store
- Used for audit logs

## 3. Receipt Generation (`handleDownloadPDF`)
- Uses `jsPDF`
- Draws:
  - School Header (Logo, Name, Address)
  - Receipt No, Date
  - Student Details (Name, Class, Roll, ID)
  - Payment Details (Months, Amount)
  - Signatures
- **Issues to Address**:
  - Receipt design could be cleaner
  - Ensure school info comes from Environment Variables
  - Ensure Auto-Save of receipt works

## 4. Proposed Refactoring (The "Rewrite")
- **Simplify State**: Consolidate payment state
- **Clearer UI**: Better month selector and fee breakdown
- **Robust Receipt**:
  - Use `GenerateReceipt.ts` helper instead of giant function inside component
  - Include School Info from `.env`
- **Verification**: Ensure DB updates are atomic/safe

## 5. New File Structure
- `src/FeeManagement.tsx` (Main UI)
- `src/utils/generateReceipt.ts` (PDF Logic)
- `src/db.ts` (Existing DB logic is good, will verify)
