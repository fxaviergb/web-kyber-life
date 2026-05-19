
# KyberLife Financial Module - AI Coding Prompts

## Database Schema

Create Supabase PostgreSQL migrations for a new financial module USING THE TECHNOLOGY IN THIS PROJECT application following Clean Architecture.

Requirements:
- financial_transactions table
- financial_scan_executions table
- financial_institutions table
- financial_accounts table
- financial_categories table
- financial_transaction_audit_logs table
- UUID primary keys
- timestamps
- indexes
- full-text search support
- ownership fields
- audit support

---

## Domain Layer

Create domain entities and repository interfaces for the KyberLife financial module.

Requirements:
- TypeScript
- Clean Architecture
- immutable entities where appropriate
- enums for transaction types and statuses
- repository interfaces

---

## Application Services

Create application services for:
- transaction management
- scan execution management
- analytics
- audit logging
- deduplication

Requirements:
- reusable services
- dependency injection compatible
- DTO validation support
- pagination support

---

## Frontend Pages

Create Next.js App Router pages for:
- /financial
- /financial/transactions
- /financial/transactions/[id]
- /financial/scans
- /financial/settings

Requirements:
- mobile-first
- responsive
- infinite scroll
- realtime updates
- loading states
- optimistic UI where applicable

---

## Realtime

Implement Supabase Realtime subscriptions for:
- financial_transactions
- financial_scan_executions

Requirements:
- reconnect support
- cleanup
- fallback polling support
- feature flags

---

## Offline Support

Implement offline support for:
- dashboard cache
- transaction cache
- manual draft transactions

Requirements:
- IndexedDB
- sync queue
- retry logic
- PWA-compatible

---

## Timeline UI

Create a mobile-first banking-style timeline UI.

Requirements:
- grouped by month/day
- badges for MANUAL/DETECTED
- filters
- search
- infinite scroll
- transaction cards
- category chips
- realtime refresh

---

## Analytics Dashboard

Create a financial dashboard using Recharts.

KPIs:
- total expenses
- total income
- balance
- pending transactions
- monthly spending

Charts:
- expense timeline
- category pie chart
- institution bar chart
- daily spending chart
