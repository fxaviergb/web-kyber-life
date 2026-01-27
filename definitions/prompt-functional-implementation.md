# Implementación End-to-End de un Flujo Funcional

Actúa como **ingeniero full-stack senior**. Debes **implementar completamente** el flujo funcional (end-to-end), incluyendo UI, lógica, persistencia in-memory, validaciones, manejo de errores, redirecciones y **tests unitarios** que deban pasar en CI. No entregues pseudocódigo: entrega cambios concretos listos para ejecutar.

# Entregables Exactos
1) Implementación completa en el repo (componentes ui, logica, persistencia, validaciones, manejo de errores, redirecciones)
2) Tests unitarios + configuración runner
3) Instrucciones de ejecución

# Flujo a Implementar
## 18) Flujo: Consultar Historial de Compras
### Objetivo
Revisar compras anteriores con fecha, supermercado y total.

### Paso a paso (usuario)
1. Ir a **Compras**.
2. Ver listado de compras completadas (orden por fecha).
3. Seleccionar una compra.
4. Ver detalle:
   - líneas compradas
   - precios registrados
   - total pagado
   - resumen por categoría (si aplica)
5. Eliminar compra 
    - Boton eliminar
    - Estado cambia a deleted

### Resultado esperado
- El usuario puede auditar qué compró y cuánto gastó, con trazabilidad. También puede eliminar compras que no quiere conservar.