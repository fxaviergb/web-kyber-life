
# KyberLife Financial Module - Transactions Menu Specification

## Purpose

This document defines all functional, UX, technical, realtime, offline and behavioral requirements for the Transactions section inside the KyberLife Financial Module.

---

# 1. ROUTES

Main route:
`/financial/transactions`

Detail route:
`/financial/transactions/[id]`

---

# 2. SCREEN PURPOSE

The Transactions screen is the central financial operations screen.

The user must be able to:

- view transactions;
- confirm transactions;
- reject transactions;
- edit transactions;
- archive transactions;
- delete transactions;
- create manual transactions;
- search transactions;
- filter transactions;
- execute bulk actions;
- review transaction origin data;
- identify duplicates.

---

# 3. UX REQUIREMENTS

## Mobile First

The screen MUST:
- prioritize mobile devices;
- use responsive layouts;
- support touch interactions;
- support infinite scroll;
- use full-screen detail pages on mobile.

---

## Visual Consistency

The implementation MUST:
- remain visually consistent with KyberLife;
- reuse current UI patterns;
- reuse current shadcn-style components;
- reuse current typography and spacing.

---

# 4. SCREEN STRUCTURE

## Header

Must contain:
- page title;
- search input;
- filter button;
- quick chips;
- create transaction button.

---

## Main Content

Must contain:
- timeline grouped by month/day;
- transaction cards;
- infinite scroll.

---

# 5. TIMELINE STRUCTURE

Transactions MUST be grouped:

Month
 ├── Day
 │    ├── Transaction

Example:

May 2026
 ├── Today
 ├── Yesterday

Ordering:
- newest first.

---

# 6. TRANSACTION CARD

Each transaction card MUST display:

- merchant;
- amount;
- currency;
- category;
- status;
- transaction type;
- institution;
- date;
- badges;
- duplicate indicators.

---

## Manual vs Detected

Transactions MUST visually distinguish:

MANUAL:
- badge `MANUAL`

DETECTED:
- badge `DETECTED`

---

# 7. TRANSACTION STATUSES

Supported statuses:

- DETECTED
- REVIEWED
- CONFIRMED
- REJECTED
- DUPLICATE
- ARCHIVED
- MANUAL
- DELETED

---

# 8. TRANSACTION TYPES

Supported types:

- EXPENSE
- INCOME
- TRANSFER
- SUBSCRIPTION
- PAYMENT
- REFUND
- WITHDRAWAL
- DEPOSIT
- FEE
- TAX
- OTHER

The implementation MUST remain extensible.

---

# 9. PENDING TRANSACTIONS

Pending transactions are:
- all transactions NOT confirmed;
- excluding archived transactions.

---

# 10. TRANSACTION DETAIL PAGE

Route:
`/financial/transactions/[id]`

The page MUST:
- be full-screen on mobile;
- display all transaction details;
- display origin information;
- display audit history.

---

## Origin Information

Must display:
- provider;
- from;
- subject;
- snippet;
- body.

The body MUST support:
- expand/collapse.

---

# 11. TRANSACTION ACTIONS

Supported actions:

- confirm;
- review;
- reject;
- archive;
- mark duplicate;
- delete;
- edit.

---

# 12. BULK ACTIONS

Supported bulk actions:

- confirm multiple;
- reject multiple;
- archive multiple;
- categorize multiple;
- delete multiple.

---

# 13. EDITABLE FIELDS

Editable fields:

- merchant;
- amount;
- currency;
- date;
- category;
- type;
- institution;
- account;
- tags;
- notes;
- status.

---

# 14. ORIGINAL VS CORRECTED VALUES

The system MUST preserve:

- original_amount
- amount

Purpose:
- auditing;
- AI improvements;
- correction tracking.

---

# 15. SEARCH

Search MUST be:
- server-side;
- paginated;
- scalable.

Searchable fields:
- merchant;
- category;
- description;
- subject;
- institution;
- tags;
- amount.

---

# 16. FILTERS

Supported filters:

- status;
- category;
- institution;
- type;
- date range;
- currency;
- manual/detected.

---

# 17. QUICK FILTER CHIPS

Examples:

- Pending
- Travel
- USD
- Airbnb

Chips MUST:
- update results instantly;
- remain mobile friendly.

---

# 18. PAGINATION

The screen MUST use:
- timeline + infinite scroll.

Requirements:
- lazy loading;
- optimized queries;
- smooth scrolling.

---

# 19. REALTIME

Primary strategy:
- Supabase Realtime.

Realtime updates MUST occur when:
- transactions inserted;
- transactions updated;
- statuses changed;
- scans completed.

Fallback:
- configurable polling.

---

# 20. OFFLINE SUPPORT

Offline support MUST include:

- cached transactions;
- cached timeline;
- manual draft creation.

Offline manual transactions MUST:
- remain as local drafts;
- synchronize automatically later.

---

# 21. DUPLICATE HANDLING

The system MUST support:
- possible_duplicate = true

Requirements:
- visual duplicate indicators;
- duplicate filtering;
- duplicate workflow.

The system MUST NOT auto-delete duplicates.

---

# 22. NOTIFICATIONS

Supported notifications:

## Toasts

- transaction confirmed;
- transaction rejected;
- scan completed;
- new transactions detected;
- errors.

## Notification Center

The module MUST integrate with:
- global notification center.

---

# 23. PERFORMANCE REQUIREMENTS

The implementation MUST:
- support large datasets;
- paginate correctly;
- optimize queries;
- avoid unnecessary rerenders;
- scale efficiently.

---

# 24. SECURITY

The implementation MUST:
- validate ownership;
- block unauthorized access;
- validate server-side actions;
- prevent cross-user access.

---

# 25. TESTING REQUIREMENTS

The implementation MUST include:

## Unit Tests
- services;
- validators;
- repositories.

## Integration Tests
- Supabase;
- realtime;
- scans.

## E2E Tests
- timeline flow;
- search;
- filters;
- transaction editing;
- bulk actions;
- detail page.

---

# 26. FEATURE FLAGS

Supported flags:

NEXT_PUBLIC_FINANCIAL_REALTIME_ENABLED=true
NEXT_PUBLIC_FINANCIAL_POLLING_ENABLED=false

---

# 27. ACCEPTANCE CRITERIA

The implementation is accepted only if:

- transactions load correctly;
- realtime updates work;
- infinite scroll works;
- mobile UX works correctly;
- search performs correctly;
- filters work correctly;
- audit trail works;
- duplicate handling works;
- offline drafts work;
- detail page works;
- bulk actions work;
- analytics remain accurate;
- security validation works;
- UI remains consistent with KyberLife.
