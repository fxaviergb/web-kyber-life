# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- **Financial Module**:
  - Added full transaction management module including income, expense, and transfer tracking.
  - Introduced `FinancialInbox` for processing scanned transactions automatically from bank notifications.
  - Added `TransactionTimeline` with advanced filtering and real-time Supabase subscriptions.
  - Comprehensive auditing and logging of transaction lifecycle.
  - Updated `README.md` to reflect the new financial management features.

### Fixed
- **Financial Module**: 
  - Fixed a state transition bug when deleting transactions by using hard deletes instead of updating to a `DELETED` state.
  - Resolved erroneous "offline cache" warnings in `TransactionTimeline` by accurately checking `navigator.onLine` instead of assuming filtered queries were cached.
  - Fixed an import collision causing a ReferenceError (`Link is not defined`) in `TransactionCard`'s DropdownMenu by renaming the import to `NextLink`.
- **Database**:
  - Purged existing soft-deleted transactions (`status = 'DELETED'`) via direct hard deletion query to maintain consistency with the new logic.

### Added
- **Environment Configuration**:
  - Documented all environment variables in `.env.example`: feature flags (`NEXT_PUBLIC_FF_FINANCIAL_*`), `NEXT_PUBLIC_BASE_URL`, `N8N_SCANNER_WEBHOOK_URL`, polling interval.
  - Added `N8N_SCANNER_WEBHOOK_URL` support for automated financial scanning via N8N webhook.
  - Added UUID validation for scanner `executionId` in `FinancialInboxService` to prevent broken foreign key references.
- **Scans Inbox UI**:
  - Redesigned `FinancialInbox` with compact card layout, inline type/merchant editing, and subtle polling status indicator.
  - Replaced full-screen reload with silent background merge of new records.
  - Added warning popover for `relatedTransactionHint` to save space.

### Fixed
- **Scans Inbox**: Type select not loading the suggested value on first render — added `normalizeTransactionType` helper.
- **Financial Module**: Fixed `realtimeStatus` unused variable lint warnings in `FinancialDashboard` and `TransactionTimeline`.
- **Session handling**: Added `useEffect` mount guard to `Sidebar` to prevent hydration mismatch with Radix UI components.
