# Purchase History & Deletion Flow - Instructions

## Execution
1.  **View History:**
    *   Navigate to `/market/purchases`.
    *   Observe two sections: **En curso** (Drafts) and **Historial** (Completed).
    *   Verify purchases are sorted by date (newest first).
2.  **View Completed Purchase:**
    *   Click on a card in the "Historial" section.
    *   Verify the view is Read-Only (no checkboxes, no inputs).
    *   Verify the "Compra Finalizada" summary showing Subtotal, Discount, Tax, and Total Paid.
3.  **Delete Purchase:**
    *   Scroll to the bottom of the detail page.
    *   Click "Eliminar Compra".
    *   Confirm the dialog.
    *   *System Action:* Redirects to list.
    *   *System Action:* The purchase disappears from the list.

## Verification (Automated)
Run the following command to verify the deletion logic:
```bash
npx jest src/application/services/__tests__/purchase-delete.test.ts
```
Expected output: `PASS`
