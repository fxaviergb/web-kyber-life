# Analytics Execution & Verification

## Overview
The **Analytics Module** provides insights into your spending habits, top products, and price trends.
It is located at `/market/analytics`.

## Prerequisite
Ensure you have "Completed" purchases with prices. If your history is empty, the charts will be empty.

## Features to Verify

### 1. Monthly Expenses (Gastos)
- **Goal**: View spending trend.
- **Action**: Go to `/market/analytics`. Default tab is "Gastos".
- **Verify**: Area chart showing total spent per month. Average monthly spend is displayed at top.

### 2. Category Ranking (Categorías)
- **Goal**: See where money goes.
- **Action**: Click "Categorías" tab.
- **Verify**: Bar chart and list sorted by highest spending.
- **Verify**: "Sin Categoría" appears if items have no category.

### 3. Frequent Products (Productos)
- **Goal**: Identify fav items.
- **Action**: Click "Productos" tab.
- **Verify**: 
    - **Top 10 Genéricos** (e.g. "Leche") by times bought.
    - **Top 10 Marcas** (e.g. "Coca Cola") by times bought.
    - Note: In V1, we show both lists or a consolidated view.

### 4. Price Analysis (Precios)
- **Goal**: Compare supermarket prices.
- **Action**: Click "Precios" tab.
- **Action**: Type in the Search Bar (e.g. "Coca") to find a brand product you bought.
- **Select**: Click a product from the dropdown.
- **Verify**:
    - **Latest Prices**: Table showing the most recent price observed in each supermarket.
    - **History**: Line chart showing price changes over time.

## Debugging
If charts don't appear:
- Check console for any Recharts errors.
- Ensure `analytics-service.test.ts` passed (backend logic is sound).
- Ensure purchases have `status: 'completed'`.
