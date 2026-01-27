# Documento de Flujos Funcionales — Kyber Life (V1)
**Propósito:** Describir el funcionamiento del sistema mediante flujos funcionales y el paso a paso del usuario para lograr cada objetivo.  
**Alcance:** V1 (in-memory, web responsive, sin uploads; imágenes como URL externa).  
**Nota:** Este documento no reitera el PRD Técnico; se enfoca únicamente en flujos y comportamiento observable.

---

## 1) Flujo: Registro de Usuario
### Objetivo
Crear una cuenta personal para acceder al sistema.

### Paso a paso (usuario)
1. El usuario abre la pantalla **Registrarse**.
2. Ingresa **email** y **contraseña**.
3. Confirma y envía el formulario.
4. El sistema muestra confirmación y redirige al **Dashboard** o **Inicio**.

### Resultado esperado
- Usuario autenticado y con espacio privado inicializado (moneda por defecto USD).

### Implementado
- SI

---

## 2) Flujo: Inicio de Sesión
### Objetivo
Acceder a la plataforma con credenciales existentes.

### Paso a paso (usuario)
1. El usuario abre la pantalla **Iniciar sesión**.
2. Ingresa email + contraseña.
3. Presiona **Entrar**.
4. El sistema redirige al **Dashboard**.

### Resultado esperado
- Sesión activa y acceso a menús privados.

### Implementado
- SI

---

## 3) Flujo: Recuperación de Contraseña
### Objetivo
Restablecer acceso cuando el usuario olvidó su contraseña.

### Paso a paso (usuario)
1. En login, el usuario selecciona **Olvidé mi contraseña**.
2. Ingresa su email y confirma.
3. Recibe un email con enlace/token (mock o real según implementación).
4. Abre el enlace e ingresa **nueva contraseña**.
5. Confirma el cambio.

### Resultado esperado
- Contraseña actualizada y token invalidado.

### Implementado
- SI

---

## 4) Flujo: Configuración de Usuario (Moneda y Perfil)
### Objetivo
Mantener configuraciones personales consistentes para compras y analítica.

### Paso a paso (usuario)
1. El usuario abre **Configuración**.
2. Revisa su información (perfil básico).
3. Selecciona su **moneda** (por defecto USD si no ha cambiado).
4. Guarda cambios.
5. (Opcional) Cambia contraseña desde esta sección.

### Resultado esperado
- La moneda seleccionada se usa como default en compras futuras.

### Implementado
- SI

---

## 5) Flujo: Administración de Supermercados (CRUD)
### Objetivo
Crear y gestionar supermercados propios (nombre y dirección) para compras y comparación de precios.

### Paso a paso (usuario)
**Crear**
1. Ir a **Supermercados**.
2. Seleccionar **Nuevo supermercado**.
3. Ingresar nombre (requerido) y dirección (opcional).
4. Guardar.

**Editar**
1. Seleccionar un supermercado de la lista.
2. Modificar campos.
3. Guardar.

**Eliminar (borrado lógico)**
1. Seleccionar un supermercado.
2. Elegir **Eliminar**.
3. Confirmar.

### Resultado esperado
- Supermercados disponibles para seleccionar en una compra.
- Eliminados no aparecen en selección, pero no rompen históricos.

### Implementado
- SI

---

## 6) Flujo: Administración de Categorías (Base + Personal)
### Objetivo
Clasificar productos para análisis de gasto y organización.

### Paso a paso (usuario)
1. Ir a **Categorías**.
2. Ver lista que incluye:
   - Categorías base (pre-cargadas).
   - Categorías personales creadas por el usuario.
3. Para crear una categoría personal:
   - Seleccionar **Nueva categoría**.
   - Ingresar nombre.
   - Guardar.
4. (Opcional) Editar/eliminar categorías personales.

### Resultado esperado
- Categorías disponibles para asignar a productos genéricos.
- Si un producto no tiene categoría, se agrupa como **“Sin categoría”**.

### Implementado
- SI

---

## 7) Flujo: Administración de Unidades (Base + Ampliable)
### Objetivo
Registrar cantidades de compra (opcional) con un catálogo controlado.

### Paso a paso (usuario)
1. Ir a **Unidades**.
2. Ver unidades base (ej. unidad, kg, L, pack) y unidades personales.
3. Para agregar unidad:
   - Seleccionar **Nueva unidad**.
   - Ingresar nombre (y símbolo si aplica).
   - Guardar.
4. (Opcional) Editar/eliminar unidades personales.

### Resultado esperado
- Unidades disponibles para usar en plantillas y compras.
- El sistema no exige unidad obligatoria.

### Implementado
- SI

---

## 8) Flujo: Gestión de Productos Genéricos (CRUD)
### Objetivo
Mantener el “catálogo personal” de productos genéricos (no ligados a marca ni supermercado) para reutilizar en plantillas y compras.

### Paso a paso (usuario)
**Crear producto genérico**
1. Ir a **Productos** → sección **Genéricos**.
2. Seleccionar **Nuevo producto genérico**.
3. Ingresar nombre (ej. “Pan para sándwich”).
4. (Opcional) Asignar:
   - Categoría primaria.
   - Tags (categorías secundarias).
   - URL de imagen externa.
5. Guardar.

**Editar**
1. Seleccionar un producto genérico.
2. Modificar campos.
3. Guardar.

**Eliminar (borrado lógico)**
1. Seleccionar un producto genérico.
2. Elegir **Eliminar**.
3. Confirmar.

### Resultado esperado
- Producto genérico disponible para incluir en plantillas.
- Si se elimina, no se borra de compras históricas (solo deja de estar activo).

### Implementado
- SI

---

## 9) Flujo: Normalización / Sinónimos (Evitar Duplicados)
### Objetivo
Evitar que el usuario tenga duplicados como “pan sándwich” vs “pan de molde”.

### Paso a paso (usuario)
1. En **Productos genéricos**, el usuario detecta duplicado o quiere mejorar búsqueda.
2. Abre el detalle del producto genérico principal (canonical).
3. Agrega un **alias/sinónimo** (texto).
4. Guarda.

### Comportamiento esperado del sistema
- En búsquedas y al agregar productos a plantillas o compras:
  - Si el usuario escribe un alias, el sistema sugiere el producto canonical.
- Si el usuario intenta crear un producto muy parecido:
  - El sistema puede sugerir “¿Quizás es el mismo que X?” (confirmación manual).

### Implementado
- SI

---

## 10) Flujo: Gestión de Opciones Específicas (Marca/Presentación) — con Precio Global y Precio por Supermercado

### Objetivo
Para cada producto genérico, administrar “opciones” (marca + presentación) y sus precios, permitiendo:
- **Precio global (referencial)** aplicable cuando no exista un precio específico por supermercado.
- **Precios por supermercado** para reflejar diferencias reales de costo según el lugar de compra.

### Paso a paso (usuario)
1. Ir al detalle de un **Producto genérico**.
2. Abrir la sección **Opciones específicas**.
3. Seleccionar **Nueva opción** (o editar una opción existente).
4. Ingresar:
   - **Marca** (ej. “Bimbo”)
   - **Presentación** (ej. “Integral 680g”)
   - (Opcional) **URL de imagen externa**
5. (Opcional) Definir **Precio global**:
   - Ingresar **precio por unidad/pack** como referencia general.
   - Seleccionar **moneda** (por defecto la del usuario).
6. (Opcional) Definir **Precio por supermercado**:
   - Seleccionar **supermercado**.
   - Ingresar **precio por unidad/pack** observado en ese supermercado.
   - Guardar (puede repetirse para múltiples supermercados).
7. Guardar la opción.

### Comportamiento esperado del sistema
- La opción queda disponible para seleccionarse durante compras.
- La plataforma puede mostrar precios de referencia de la opción:
  - **Si existe precio por supermercado** para el supermercado de la compra, ese es el que se sugiere/visualiza.
  - **Si no existe precio por supermercado**, se muestra el **precio global** como referencia.
  - Si no existe ninguno, la opción aparece **sin precio** hasta que el usuario lo registre.

### Resultado esperado
- La opción específica queda registrada (marca/presentación).
- Puede contar con **precio global** (referencial) y/o **precios por supermercado**.
- Durante compras, el usuario ve la mejor referencia disponible según el supermercado seleccionado.

### Implementado
- SI

---

## 10.1)  Flujo: Gestionar Productos Específicos (Marca/Presentación + Precio Global + Precios por Supermercado) dentro de un Producto Genérico

### Objetivo
Permitir que el usuario, desde un **producto genérico**, pueda:
- Crear y administrar **productos específicos** (marca + presentación).
- Definir un **precio global** (referencial) por producto específico.
- Asociar el producto específico a **uno o varios supermercados** donde se encuentra disponible.
- Registrar un **precio por supermercado** (por unidad/pack) para cada supermercado asociado.

---

### Precondiciones
- El usuario está autenticado.
- Existe al menos un **producto genérico** creado.
- (Opcional) Existen **supermercados** creados por el usuario (si no existen, el flujo debe permitir crearlos desde el mismo contexto).

---

### Paso a paso (usuario)

#### A) Acceder al módulo de productos específicos de un genérico
1. El usuario va a **Productos** y selecciona un **Producto genérico**.
2. En el detalle del genérico, abre la sección **Productos específicos** (o “Opciones específicas”).

**Resultado:** se muestra la lista de productos específicos existentes para ese genérico (si hay), con un botón **Agregar producto específico**.

---

#### B) Crear un producto específico (marca/presentación)
3. El usuario selecciona **Agregar producto específico**.
4. El sistema muestra un formulario (modal o panel) con campos:
   - **Marca** (requerido)
   - **Presentación** (requerido, ej. “Integral 680g”)
   - (Opcional) **URL de imagen externa**
5. El usuario completa los datos y presiona **Guardar**.

**Resultado:** el producto específico queda creado y aparece en la lista del genérico.

---

#### C) Definir precio global (referencial)
6. En el detalle del producto específico, el usuario activa/selecciona la opción **Precio global**.
7. Ingresa:
   - **Precio global por unidad/pack**
   - **Moneda** (por defecto la del usuario, editable)
8. Presiona **Guardar**.

**Resultado:** el producto específico queda con **precio global** visible como referencia general.

---

#### D) Asociar supermercados donde el producto específico está disponible
9. En el mismo detalle, el usuario abre la sección **Disponibilidad en supermercados**.
10. Selecciona **Agregar supermercado**.
11. El sistema muestra un selector:
   - Lista de supermercados del usuario.
   - Opción **Crear supermercado** (en línea) si no existe.
12. El usuario selecciona uno o varios supermercados y confirma.

**Resultado:** el producto específico queda asociado a esos supermercados como “disponible”.

---

#### E) Registrar precio por supermercado
13. En la lista de supermercados asociados, el usuario elige uno (ej. “Walmart”).
14. Presiona **Registrar/Actualizar precio**.
15. Ingresa:
   - **Precio por unidad/pack** para ese supermercado
   - (Opcional) **Moneda** (por defecto la del usuario)
16. Guarda.

17. Repite para otros supermercados si aplica.

**Resultado:** cada supermercado puede tener su **precio propio** para el mismo producto específico.

---

#### F) Edición y mantenimiento
18. El usuario puede:
- Editar marca/presentación o URL de imagen.
- Actualizar precio global.
- Actualizar precio por supermercado.
- Quitar un supermercado de la disponibilidad del producto específico.
- Eliminar (borrado lógico) el producto específico.

---

### Comportamiento esperado del sistema
- El producto específico puede existir con:
  - Solo **precio global**.
  - Solo **precios por supermercado**.
  - Ambos.
  - Ninguno (pendiente de completar).
- En contextos donde se necesite “precio sugerido” (ej. flujo de compra):
  - Si existe **precio por supermercado** para el supermercado actual, se usa como referencia.
  - Si no existe, se muestra el **precio global** como fallback.
  - Si no existe ninguno, se muestra “Sin precio” y se solicita ingreso manual.
- La disponibilidad por supermercado no obliga a tener precio, y viceversa (se permiten estados parciales).

---

### Resultado final del flujo
El usuario logra que un **producto genérico** tenga uno o varios **productos específicos** asociados, cada uno con:
- Marca + presentación (y URL de imagen externa opcional),
- Precio global (opcional),
- Lista de supermercados donde está disponible,
- Precio por supermercado (opcional por cada supermercado asociado).

### Implementado
- SI

---

## 11) Flujo: Gestión de Plantillas (Listas Reutilizables)
### Objetivo
Construir listas recurrentes (por tipo: comida/limpieza, o por supermercado) que se combinan al crear una compra.

### Paso a paso (usuario)
**Crear plantilla**
1. Ir a **Plantillas**.
2. Seleccionar **Nueva plantilla**.
3. Ingresar nombre (ej. “Limpieza”, “Supermercado A”) y etiquetas (ej. “comida”, “hogar”).
4. Guardar.

**Agregar productos a plantilla**
1. Abrir detalle de la plantilla.
2. Seleccionar **Agregar producto**.
3. Buscar y elegir un producto genérico existente (o crear uno nuevo).
4. (Opcional) Definir defaults:
   - Cantidad por defecto.
   - Unidad por defecto.
5. Guardar.

**Quitar producto de plantilla**
1. En la lista de items, seleccionar remover.
2. Confirmar.

### Resultado esperado
- Plantillas listas para seleccionarse en una compra.
- Defaults se proponen en compra, pero el usuario puede cambiarlos.

### Implementado
- SI

---

## 11.1) Flujo: Precio Global en Productos Genéricos + Actualización Automática desde una Compra

### Objetivo
Permitir que cada **producto genérico** tenga un **precio global (referencial)** y que, durante el flujo de compra, si el usuario **modifica ese precio global**, el sistema lo **actualice automáticamente** en el registro del producto genérico para futuras referencias.

> Nota: El precio global del genérico es independiente de los precios de productos específicos (marca/presentación). Sirve como referencia general cuando no hay información más precisa.

### Precondiciones
- El usuario está autenticado.
- Existe al menos un **producto genérico** creado.
- El usuario puede iniciar o editar una **compra** en estado borrador.

## A) Configurar precio global del producto genérico (catálogo)
### Paso a paso (usuario)
1. El usuario abre **Productos** y selecciona un **Producto genérico**.
2. En el detalle del genérico, ubica la sección **Precio global**.
3. Ingresa:
   - **Precio global por unidad/pack** (referencial)
   - **Moneda** (por defecto la del usuario; editable)
4. Presiona **Guardar**.

### Resultado esperado
- El producto genérico queda con un precio global visible y utilizable como referencia en compras.

---

## B) Usar el precio global del genérico como referencia durante una compra
### Paso a paso (usuario)
1. El usuario inicia una **Nueva compra** (selecciona supermercado y plantillas).
2. El sistema genera la lista consolidada.
3. Para cada producto genérico, el sistema muestra:
   - recomendación de producto específico (si existe)
   - **precio por supermercado (si existe)**
   - si no existe precio por supermercado, muestra el **precio global del genérico** como referencia
4. El usuario decide si mantiene el precio sugerido o lo modifica.

### Resultado esperado
- El usuario ve un precio referencial aun cuando no existan precios por supermercado o por producto específico.

---

## C) Actualizar el precio global del genérico desde el flujo de compra
### Paso a paso (usuario)
1. En la lista de compra, el usuario abre la línea del **producto genérico** (detalle inline o drawer).
2. El sistema muestra el campo **Precio global del genérico** con su valor actual.
3. El usuario modifica el **precio global** (ej. por un cambio detectado en la tienda).
4. El sistema solicita confirmación clara:
   - “¿Deseas **actualizar el precio global** de este producto genérico para futuras compras?”
   - opciones: **Sí, actualizar** / **No, solo para esta compra**
5. El usuario elige **Sí, actualizar**.
6. Continúa con la compra (selecciona opción específica si aplica, marca comprado, etc.).

### Resultado esperado
- El sistema registra el nuevo precio global del genérico como parte de la compra actual y lo marca como actualización persistente.

### D) Persistencia de la actualización (cuándo se actualiza el catálogo)
#### Comportamiento esperado del sistema
- Si el usuario seleccionó **Sí, actualizar**:
  - El sistema **actualiza el registro del producto genérico** con el nuevo precio global.
  - Esta actualización se ejecuta:
    - **en el momento** (al confirmar) o
    - **al finalizar la compra** (recomendado para consistencia y rollback si se cancela).
- Si el usuario seleccionó **No, solo para esta compra**:
  - El precio se aplica únicamente a la línea de la compra actual.
  - El precio global del genérico **no cambia** en el catálogo.

---

### E) Finalización de compra y consistencia
#### Paso a paso (usuario)
1. El usuario finaliza la compra con total pagado.
2. El sistema:
   - guarda la compra como completed
   - aplica actualizaciones pendientes del catálogo (si se configuró “actualizar al finalizar”)

#### Resultado esperado
- El precio global del producto genérico queda actualizado para futuras compras cuando el usuario lo confirmó.

### Reglas del flujo (críticas)
1. **Precio global del genérico es referencial**, no obliga a tener qty/unit.
2. Si existe **precio por supermercado** para el mismo genérico (si el sistema lo soporta) o un precio más específico (marca/presentación), estos pueden mostrarse como referencias “más precisas”, pero el genérico mantiene su precio global como fallback.
3. La actualización del precio global del genérico desde una compra **no debe ser automática sin confirmación** del usuario.
4. El precio global del genérico se guarda con:
   - monto
   - moneda (por defecto del usuario, editable si el usuario decide)
   - timestamp de última actualización (recomendado)
5. El usuario puede revertir manualmente el precio global editando el genérico en el catálogo.

### Resultado final del flujo
El usuario puede gestionar un **precio global en productos genéricos** y, durante una compra, si detecta cambios de precio, puede **actualizar el precio global** con confirmación, dejando el catálogo listo para futuras compras con referencias más actuales.

### Implementado
- SI

---

## 12) Flujo Principal: Crear una Nueva Compra
### Objetivo
Crear una sesión de compra basada en supermercado + plantillas seleccionadas.

### Paso a paso (usuario)
1. Ir a **Compras**.
2. Seleccionar **Nueva compra**.
3. Elegir:
   - Supermercado (de su catálogo).
   - Fecha (por defecto hoy).
   - Una o varias plantillas.
4. Confirmar **Generar lista**.

### Resultado esperado
- Se crea una compra en estado **borrador**.
- El sistema genera la lista consolidada de productos.

### Implementado
- SI

---

## 13) Flujo: Generación de Lista Consolidada (Optimizada)
### Objetivo
Construir una lista única, sin duplicados, con recomendaciones de marca/precio para el supermercado seleccionado.

### Paso a paso (usuario)
1. Tras generar lista, el usuario ve los productos agrupados por categoría.
2. Revisa recomendaciones por producto.

### Comportamiento esperado del sistema
- **Consolidación**
  - Fusiona items de plantillas seleccionadas.
  - Elimina duplicados usando canonical + aliases.
- **Categorías**
  - Si el genérico no tiene categoría primaria: “Sin categoría”.
  - Si hay conflicto de categoría por duplicados entre plantillas: el sistema deja “Sin categoría” y continúa.
- **Recomendación de opción específica (no automática)**
  - Recomienda “última opción comprada” en ese supermercado.
  - Si no existe, recomienda según última observación de precio en ese supermercado.
  - Si no hay datos, no recomienda.

### Implementado
- SI

---

## 14) Flujo: Ejecución de Compra en Tienda (Checklist + Registro de Precio)
### Objetivo
Marcar productos comprados, elegir marca/presentación, actualizar precios y registrar cantidades.

### Paso a paso (usuario)
1. En la compra borrador, el usuario recorre la lista.
2. Para cada producto genérico:
   1) (Opcional) Ajusta **cantidad** y **unidad** (si aplica).
   2) Selecciona la **opción específica** (marca/presentación):
      - Puede elegir la recomendada o cualquier otra.
      - Si ninguna aplica, crea una opción nueva.
   3) Ingresa el **precio por unidad/pack** observado en ese supermercado.
   4) Marca el producto como **comprado** (check).
3. Repite hasta completar.

### Reglas durante el flujo
- Si el usuario intenta marcar como comprado sin precio:
  - El sistema lo bloquea y solicita el unitPrice.
- Si qty/unit no se ingresan:
  - El sistema permite continuar (son opcionales).
- La recomendación siempre es opcional:
  - No se auto-selecciona.

### Resultado esperado
- Compra con líneas completadas (checked + unitPrice; qty/unit opcionales).

### Implementado
- SI

---

## 15) Flujo: Agregar Productos No Planificados Durante la Compra
### Objetivo
Incorporar un producto que el usuario decidió comprar en el momento.

### Paso a paso (usuario)
1. Dentro de la compra, seleccionar **Agregar producto no planificado**.
2. Ingresar el nombre del nuevo producto genérico.
3. (Opcional) Categoría primaria, tags, url imagen.
4. Guardar y añadir a la lista de la compra.
5. El sistema pregunta: “¿Deseas agregar este producto a una plantilla?”
6. El usuario selecciona una plantilla destino (de las seleccionadas o cualquiera propia).
7. Continúa con el flujo normal:
   - elegir opción específica
   - ingresar unitPrice
   - check comprado

### Resultado esperado
- El producto queda en la compra actual y, si el usuario lo decide, queda persistido en una plantilla para futuras compras.

### Implementado
- SI

---

## 16) Flujo: Finalización de Compra (Total Pagado + Cierre)
### Objetivo
Cerrar la compra con total pagado y generar el resumen.

### Paso a paso (usuario)
1. El usuario selecciona **Finalizar compra**.
2. Ingresa el **total pagado** en la caja.
3. Revisa el resumen:
   - items comprados
   - items pendientes (si dejó alguno sin comprar)
   - gasto por categoría (según datos calculables)
4. Confirma.

### Resultado esperado
- La compra pasa a estado **completed**.
- Se bloquea la edición “libre” (o se limita a correcciones controladas, según decisión de implementación).
- Se dispara el registro del historial de precios.

### Implementado
- SI

---

## 17) Flujo: Registro Automático de Historial de Precios al Finalizar
### Objetivo
Actualizar el histórico de precios por supermercado para opciones específicas.

### Paso a paso (usuario)
- No hay pasos manuales adicionales. Ocurre automáticamente al finalizar.

### Comportamiento esperado del sistema
1. Para cada línea comprada que tenga:
   - opción específica seleccionada
   - unitPrice informado
2. Se crea una observación de precio asociada a:
   - opción específica
   - supermercado
   - moneda
   - fecha de la compra

### Resultado esperado
- El sistema queda listo para sugerencias futuras y comparaciones por supermercado.

### Implementado
- SI

---

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

### Implementado
- SI

---

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

---

## 24) Flujo: Cierre de Sesión
### Objetivo
Salir de la plataforma de forma segura.

### Paso a paso (usuario)
1. Abrir menú de usuario.
2. Seleccionar **Cerrar sesión**.
3. Confirmar.

### Resultado esperado
- Sesión terminada y retorno a login.

---

## 24) Flujo: Cerrar Sesión (Logout)
### Objetivo
Cerrar la sesión del usuario de forma explícita y segura, evitando que terceros usen la sesión activa.

### Paso a paso (usuario)
1. El usuario abre el **menú de usuario** (avatar/ícono de perfil) disponible en:
   - la **barra superior** (mobile/desktop), o
   - el **sidebar** (desktop), o
   - **Configuración** (acceso redundante).
2. Selecciona la opción **Cerrar sesión**.
3. (Opcional recomendado) El sistema muestra un modal de confirmación:
   - “¿Seguro que deseas cerrar sesión?”
   - botones: **Cancelar** / **Cerrar sesión**
4. El usuario confirma **Cerrar sesión**.
5. El sistema:
   - invalida la sesión en servidor (si existe store de sesión) o
   - elimina la cookie/token de sesión (httpOnly) y limpia estado local.
6. El usuario es redirigido a **/auth/login** (o /auth/register si login no está habilitado aún).

### Resultado esperado
- No existe sesión activa.
- Cualquier intento de acceder a rutas protegidas (ej. Dashboard/Compras) redirige a login.
- El UI no muestra datos del usuario (se restaura a estado no autenticado).

### Consideraciones funcionales
- Si el usuario cierra sesión con cambios sin guardar (ej. compra en borrador):
  - No se pierde lo guardado previamente.
  - Cualquier cambio no persistido se descarta.
- Logout debe funcionar en mobile y desktop con el mismo comportamiento.

### IMPLEMENTADO
- SI

---