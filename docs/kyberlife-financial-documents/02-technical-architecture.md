
# KyberLife Financial Module - Technical Architecture

## 1. Architecture Style

The module follows the existing KyberLife Clean Architecture approach.

```text
src/domain
src/application
src/infrastructure
src/app
src/presentation
```

---

## 2. Domain Entities

### FinancialTransaction

Core financial movement.

Key fields:
- id
- owner_user_id
- type
- status
- amount
- original_amount
- currency
- merchant
- category_id
- institution_id
- account_id
- tags
- notes
- possible_duplicate
- execution_id
- origin_stats
- created_at
- updated_at

### FinancialScanExecution

Represents an n8n scan execution.

Statuses:
- PROCESSING
- FAILED
- COMPLETED

### FinancialInstitution

Financial provider entity.

### FinancialAccount

Bank account / card / cash source.

### FinancialCategory

Financial category.

### FinancialTransactionAuditLog

Audit trail.

---

## 3. Suggested Folder Structure

```text
src/
 ├── application/services/financial/*
 ├── domain/entities/financial/*
 ├── domain/repositories/financial/*
 ├── infrastructure/repositories/supabase/financial/*
 ├── app/financial/*
 └── presentation/components/financial/*
```

---

## 4. Realtime Strategy

Use Supabase Realtime subscriptions:

- financial_transactions
- financial_scan_executions

Trigger updates:
- insert
- update

Fallback:
- polling every configurable interval

---

## 5. Search Strategy

Search must be:
- server-side
- paginated
- scalable

Searchable fields:
- merchant
- category
- description
- subject
- institution
- tags
- amount

---

## 6. Pagination

Recommended:
- timeline grouping
- infinite scroll

---

## 7. Offline Strategy

PWA caching:
- dashboard
- latest transactions
- manual drafts

Local persistence:
- IndexedDB/local storage

---

## 8. Feature Flags

```env
NEXT_PUBLIC_FINANCIAL_REALTIME_ENABLED=true
NEXT_PUBLIC_FINANCIAL_POLLING_ENABLED=false
NEXT_PUBLIC_FINANCIAL_AI_ENABLED=true
NEXT_PUBLIC_FINANCIAL_OFFLINE_ENABLED=true
NEXT_PUBLIC_FINANCIAL_RECURRING_ENABLED=false
```

---

## 9. Security

- Supabase authentication
- User ownership validation
- Hard delete support
- Audit logging

---

## 10. Testing

Required:
- unit tests
- integration tests
- realtime tests
- offline tests
