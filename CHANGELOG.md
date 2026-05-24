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
