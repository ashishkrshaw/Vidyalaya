# Vidyalaya - Complete Frontend Pages

## 📋 Current Pages (Already Done)
| Page | Status |
|------|--------|
| Login | ✅ |
| New Admission | ✅ |
| Search Student | ✅ |
| Fee Management | ✅ |
| Statistics | ✅ |
| History | ✅ |
| Settings | ✅ |

---

## 🆕 New Pages Needed

### 1. 📊 Transaction History Page
**Purpose**: View all UPI/Online payments

| Field | Type |
|-------|------|
| Date | Display |
| Student Name | Display + Link |
| Class/Section | Display |
| Amount | Display |
| Status | Badge (Success/Pending/Failed) |
| Transaction ID | Display |
| Actions | Button (Receipt/Resend/Retry) |

**Filters**: Class, Village, Date Range, Status, Search

---

### 3. ⚙️ Integrations Page (COMBINED)
**Purpose**: Payment Gateway + Notifications + Auto Reminders in one page with TABS

| Tab | Fields |
|-----|--------|
| 💳 Payment Gateway | Gateway, Merchant ID, Key, Environment |
| 📨 Notifications | SMS Provider, API Key, WhatsApp toggle |
| ⏰ Auto Reminders | Enable, Date, Time, Template, Late Fee |

> **Optimization:** 3 separate pages → 1 page with 3 tabs = Cleaner UX!

---

### 4. 📤 Bulk Send Payment Links
**Purpose**: Send payment links to multiple students

| Feature | Description |
|---------|-------------|
| Select Class | Dropdown |
| Select Students | Multi-select checkboxes |
| Amount Type | Dropdown (Due Amount / Custom) |
| Send via | Checkbox (SMS / WhatsApp / Both) |
| Preview | Show count and total |
| Send Button | Trigger bulk send |

---

### 5. 🏘️ Village/Area Management
**Purpose**: Manage villages for filtering

| Field | Type |
|-------|------|
| Village Name | Input |
| District | Input |
| Active | Toggle |
| Actions | Edit / Delete |

---

### 6. 📄 Reports Page
**Purpose**: Generate various reports

| Report Type |
|-------------|
| Class-wise Fee Collection |
| Monthly Collection Summary |
| Dues Report |
| Village-wise Report |
| Export to Excel/PDF |

---

## 🌐 Public Website Pages

### 8. 🏠 Landing Page (Public)
**Purpose**: Marketing page for new schools

| Section |
|---------|
| Hero with tagline |
| Features list |
| Pricing plans |
| Testimonials |
| Contact form |
| Footer |

---

### 9. 💰 Pricing Page
**Purpose**: Show subscription plans

| Plan | Features | Price |
|------|----------|-------|
| Free | GDrive storage, 50 students | ₹0 |
| Basic | MongoDB, 200 students, SMS | ₹499/mo |
| Pro | Unlimited, WhatsApp, Support | ₹999/mo |

---

### 10. 📱 Parent Payment Portal
**Purpose**: Parent opens link and pays

| Feature |
|---------|
| Student Details (name, class, photo) |
| Due Amount |
| Month Selection |
| Pay Now Button |
| Download Receipt (after payment) |

---

### 11. 📄 Reports Page
**Purpose**: Generate various reports

| Report Type |
|-------------|
| Class-wise Fee Collection |
| Monthly Collection Summary |
| Dues Report |
| Village-wise Report |
| Export to Excel/PDF |

---

## 📁 Updated Sidebar Menu

```
📊 Dashboard
├── 👤 New Admission
├── 🔍 Search Student
├── 💳 Fee Management (Online + Cash modes)
├── 📊 Transaction History (NEW)
├── 📤 Bulk Send Links (NEW)
├── 📄 Reports (NEW)
├── 📜 History
└── ⚙️ Settings
    ├── School Info
    ├── Fee Structure
    ├── Integrations (NEW - Combined)
    │   ├── Tab: Payment Gateway
    │   ├── Tab: Notifications
    │   └── Tab: Auto Reminders
    └── Villages (NEW)
```

---

## 🔄 Optimization Summary

| Before (7 new pages) | After (Optimized) |
|----------------------|-------------------|
| Payment Gateway Settings | → Integrations Tab 1 |
| Notification Settings | → Integrations Tab 2 |
| Auto Reminder Settings | → Integrations Tab 3 |
| Cash Payment Entry | → Fee Management Mode |

---

## 🎯 Priority Order

1. **Transaction History** - Most important
2. **Payment Gateway Settings** - Needed for Paytm
3. **Parent Payment Portal** - Public page
4. **Cash Payment Entry** - Common use case
5. **Notification Settings** - For SMS/WhatsApp
6. **Bulk Send Links** - Time saver
7. **Reports** - Nice to have
8. **Landing/Pricing** - For marketing
