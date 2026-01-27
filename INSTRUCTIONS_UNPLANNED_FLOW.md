# Unplanned Product Flow - Instructions

## Execution
1.  **Open Purchase:** Go to `/market/purchases` and open an active purchase.
2.  **Add Unplanned Item:**
    *   Click the **"Agregar producto no planificado"** button (next to "Finalizar" or in controls).
    *   **Modal Step 1:** Enter "New Item Name" (e.g., "Galletas"). Optionally select a Category.
    *   Click "Guardar y añadir".
    *   *System Action:* Creates generic item and adds it to the list.
3.  **Template Decision:**
    *   **Modal Step 2:** System asks "Deseas agregar este producto a una plantilla?".
    *   **Option A:** Select a template from the list. Click it.
        *   *Expected:* Item added to template, modal closes.
    *   **Option B:** Click "No agregar a plantilla".
        *   *Expected:* Modal closes.
4.  **Verification:**
    *   The new item "Galletas" appears in the checklist (likely under the category you chose or "Sin Categoría").
    *   You can now proceed to select brand, enter price, and check it.

## Technical Details
*   **Actions:** `createGenericItemAction` -> `addPurchaseLineAction` -> (optional) `addTemplateItemAction`.
*   **Persistence:** Item is persisted in DB immediately.
