# Implementación End-to-End de un Flujo Funcional

Actúa como **ingeniero full-stack senior**. Debes **implementar completamente** el flujo funcional (end-to-end), incluyendo UI, lógica, persistencia in-memory, validaciones, manejo de errores, redirecciones y **tests unitarios** que deban pasar en CI. No entregues pseudocódigo: entrega cambios concretos listos para ejecutar.

# Entregables Exactos
1) Implementación completa en el repo (componentes ui, logica, persistencia, validaciones, manejo de errores, redirecciones)
2) Tests unitarios + configuración runner
3) Instrucciones de ejecución

# Flujo a Implementar
## 19) Flujo: Analítica — Promedio Mensual y Tendencias
### Objetivo
Entender el comportamiento de gasto a lo largo del tiempo.

### Paso a paso (usuario)
1. Ir a **Analítica** → sección **Gastos**.
2. Seleccionar rango de tiempo (opcional).
3. Visualizar:
   - gasto por mes calendario
   - promedio mensual calculado
4. (Opcional) Filtrar por supermercado.

### Resultado esperado
- Métrica clara de gasto mensual y tendencia.

---

## 20) Flujo: Analítica — Categorías con Mayor Gasto
### Objetivo
Identificar en qué categorías se concentra el gasto.

### Paso a paso (usuario)
1. Ir a **Analítica** → **Categorías**.
2. Ver ranking de categorías por gasto acumulado.
3. Abrir una categoría para ver:
   - productos que más contribuyen al gasto
4. (Opcional) Filtrar por mes/supermercado.

### Consideración funcional
- Productos sin categoría primaria se muestran en “Sin categoría”.

---

## 21) Flujo: Analítica — Productos Más Frecuentes (Genéricos y Marcas)
### Objetivo
Ver hábitos de compra por repetición y por volumen.

### Paso a paso (usuario)
1. Ir a **Analítica** → **Productos**.
2. Elegir modo:
   - frecuencia por número de compras en las que aparece
   - frecuencia por unidades (segmentado por unidad)
3. Alternar vista:
   - genéricos
   - opciones específicas (marca/presentación)

### Resultado esperado
- Top productos por frecuencia con filtros básicos.

---

## 22) Flujo: Analítica — Comparación de Precios entre Supermercados (Última Observación)
### Objetivo
Comparar el precio más reciente observado de un producto específico en distintos supermercados.

### Paso a paso (usuario)
1. Ir a **Analítica** → **Precios**.
2. Buscar y seleccionar una opción específica (marca/presentación) o un genérico (según vista).
3. El sistema muestra:
   - lista de supermercados
   - último precio observado
   - fecha de observación
4. (Opcional) Cambiar moneda si el usuario trabaja con más de una (según configuración).

### Resultado esperado
- Comparación rápida basada en la última observación registrada.

---

## 23) Flujo: Historial de Precios (Serie Temporal)
### Objetivo
Entender cómo cambia el precio de una opción específica en el tiempo.

### Paso a paso (usuario)
1. Ir a detalle de un producto genérico o a analítica de precios.
2. Seleccionar una opción específica (marca/presentación).
3. Ver gráfico/tabla:
   - fechas vs precios (por supermercado)
4. Filtrar por supermercado si el usuario desea.

### Resultado esperado
- Trazabilidad de cambios de precio para decisiones de compra.