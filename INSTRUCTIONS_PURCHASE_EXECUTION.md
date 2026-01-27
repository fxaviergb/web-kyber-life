# Purchase Execution Flow - Instructions

## Execution
1.  **Start:** Go to `/market/purchases` and open a "Draft" purchase.
    *   *Prerequisite:* Create a new purchase if none exists.
2.  **Checklist Interaction:**
    *   **Price Validation:** Try to check an item without entering a price.
        *   *Expected:* Alert "Ingresa el precio antes de marcar como comprado" (and/or red border). Checkbox remains unchecked.
    *   **Enter Price:** Enter a value (e.g. 10) in the price field.
    *   **Check Item:** Click the checkbox again.
        *   *Expected:* Item is crossed out (checked).
    *   **Select Option:** Open the dropdown for an item.
        *   Select an existing brand.
        *   Select **"+ Crear nueva opción..."**.
            *   *Expected:* Modal opens.
            *   Enter Brand "MyBrand", Presentation "1kg". Click Create.
            *   *Expected:* Modal closes, page refreshes (briefly), and "MyBrand 1kg" is now selectable (or selected if logic persists).
    *   **Adjust Qty/Unit:** Edit quantity or unit.
3.  **Finish:**
    *   Click "Finalizar".
    *   If any checked item has no price (bypass UI somehow?): System shows error modal.
    *   Confirm.
    *   *Expected:* Purchase status becomes `completed`. Prices are saved to History/Observations.

## Unit Tests
Run:
```bash
npm test src/__tests__/purchase-service.test.ts
```
*Note: Test environment configuration may need adjustment for TypeScript execution.*
