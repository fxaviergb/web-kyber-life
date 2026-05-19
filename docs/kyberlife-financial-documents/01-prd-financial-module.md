
# KyberLife Financial Module - Product Requirements Document (PRD)

## 1. Overview

KyberLife introduces a new bounded context called `financial` focused on personal financial transaction management detected automatically from email sources using n8n workflows.

The module is independent from the existing `market` domain but designed for future interoperability.

---

## 2. Objectives

The module allows users to:

- View automatically detected financial transactions.
- Confirm or reject detected transactions.
- Edit detected transaction metadata.
- Create manual financial transactions.
- Launch financial scans manually.
- View financial analytics and dashboards.
- Receive realtime transaction updates.
- Work partially offline through PWA support.

---

## 3. Navigation

```text
/financial
 ├── Overview
 ├── Transactions
 ├── Scans
 └── Settings
```

---

## 4. Core Functionalities

### 4.1 Overview Dashboard

Displays:
- Total expenses
- Total income
- Current balance
- Pending transactions
- Monthly spending
- Top categories
- Top merchants

### 4.2 Transactions

Capabilities:
- Timeline view
- Infinite scroll
- Group by month/day
- Filters
- Full-text search
- Bulk actions
- Transaction detail page
- Manual transaction creation

### 4.3 Scans

Capabilities:
- Launch scan manually
- Scan history
- Scan status tracking
- Realtime updates

### 4.4 Settings

Includes:
- Categories
- Tags
- Scan preferences
- Notification preferences
- Feature flags

---

## 5. Transaction Workflow

### Statuses

```text
DETECTED
REVIEWED
CONFIRMED
REJECTED
DUPLICATE
ARCHIVED
MANUAL
DELETED
```

### Main Flow

```text
DETECTED → REVIEWED → CONFIRMED
```

### Alternative Flows

```text
DETECTED → REJECTED
DETECTED → DUPLICATE
DETECTED → ARCHIVED
DETECTED → DELETED
CONFIRMED → ARCHIVED
ANY → DELETED
```

---

## 6. Transaction Types

```text
EXPENSE
INCOME
TRANSFER
SUBSCRIPTION
PAYMENT
REFUND
WITHDRAWAL
DEPOSIT
FEE
TAX
OTHER
```

---

## 7. Realtime

Primary mechanism:
- Supabase Realtime

Fallback:
- Configurable polling

---

## 8. Offline Support

Supported offline:
- Cached dashboard
- Cached transactions
- Manual draft transactions
- Deferred synchronization

---

## 9. Notifications

Channels:
- Toast notifications
- Notification center

Events:
- Scan completed
- New transactions detected
- Scan failures

---

## 10. Future Roadmap (Out of MVP)

- AI anomaly detection
- Recurring payment detection
- AI recommendations
- Financial AI assistant
- Budgeting
- Forecasting
