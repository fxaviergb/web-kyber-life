# Purchase Completion Flow - Instructions (Updated)

## Execution
1.  **Open Purchase:** Go to `/market/purchases` and open an active purchase.
2.  **Ensure Prices:** Make sure all checked items have a price.
3.  **Click Finalizar:** Click the "Finalizar" button.
4.  **Review Summary:**
    *   Check "Gasto Calculado (Checklist)" matches your expectation from the app tracking.
5.  **Enter Ticket Details:**
    *   **Subtotal (Ticket):** Enter the subtotal from the physical receipt. (Defaults to calculated total).
    *   **Descuentos:** Enter any discounts applied at the register.
    *   **Impuestos:** Enter tax amount if applicable.
    *   **Total Pagado en Caja (Real):** Enter the final amount actually paid.
6.  **Confirm:** Click "Confirmar y Cerrar".
    *   *System Action:* Purchase closes, status `completed`.
    *   *System Action:* Financial breakdown is saved.
    *   *System Action:* Prices saved to history (Logic verified by Test).

## Verification (Automated)
Run the following command to verify the Price History logic:
```bash
npx jest src/application/services/__tests__/purchase-price-history.test.ts
```
Expected output: `PASS`
