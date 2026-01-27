# PRD Técnico — Plataforma WEB Personal: KYBER LIFE (V1)
**Versión:** 1.0  
**Fecha:** 2026-01-24  
**Estado:** Listo para implementación (V1)  
**Objetivo del documento:** Servir como contexto único y accionable para construir el sistema (sin ambigüedad), minimizando “alucinaciones” de stack y alcance.

---

## 0) Resumen Ejecutivo (V1)
Se construirá una plataforma WEB personal con autenticación (usuario/contraseña) donde cada usuario tendrá a disposición una lista de menús con distintas funcionalidades. La primera funcionalidad será "Supermercado", aquí el usuario administra **plantillas** de compras, **productos genéricos** con **opciones específicas** (marca/presentación) y **precios por supermercado** definidos por el usuario.  
El usuario crea una **Compra** seleccionando un supermercado y una o varias plantillas; el sistema consolida la lista, sugiere la “última opción comprada” (solo como recomendación), permite registrar cantidades/unidades (opcionales) y precio por unidad/pack, finaliza con un total pagado y genera estadísticas.

**Fuera de alcance V1:** subida de archivos (tickets/imágenes), OCR, app móvil nativa, carpetas jerárquicas de plantillas.

---

## A) Stack Tecnológico Definido (Estricto)
### A.1 Lenguaje
- **TypeScript** (estricto: `strict: true`).

### A.2 Frontend / Backend Framework
- **Next.js (App Router)** en TypeScript.
- Arquitectura: **Clean Architecture** + principios **SOLID**.
- Estilo: componentes UI minimalistas, **mobile-first**, responsive.

### A.3 Persistencia (V1)
- **Base de datos en memoria (in-memory)** como primer entregable.
- Implementar repositorios con interfaces para permitir reemplazo posterior por motor real (Supabase recomendado en V2).
- Prohibido acoplar lógica de dominio a la implementación in-memory.

### A.4 Autenticación y Seguridad
- Autenticación por **email + password**.
- Contraseñas: **hash seguro** (p. ej. bcrypt/argon2). Prohibido almacenar plaintext.
- Recuperación de contraseña por email: **token de un solo uso con expiración**.
- Control de acceso: **por usuario** (multi-tenant por separación lógica). Prohibido acceso cruzado.
- Validación de entradas: obligatoria en capa de aplicación.

### A.5 No incluidos en V1 (Hard tech constraints)
- No usar OCR.
- No subir archivos (ticket PDF/imagen).
- Imágenes se manejan como **URLs externas** (string), sin almacenamiento propio.

---

## B) Alcance Funcional (V1)
### B.1 Módulos / Menús (V1)
1. **Autenticación**
2. **Configuración de usuario**
   - moneda por defecto USD, configurable.
3. **Supermercados**
   - CRUD; incluye dirección (texto).
4. **Categorías**
   - catálogo mixto (base + personal).
5. **Unidades**
   - catálogo cerrado base + ampliable por usuario; no obligatoria por producto.
6. **Productos genéricos**
   - nombre canonical + alias/sinónimos; categorías (primaria opcional + tags opcionales); imagenUrl externa opcional.
7. **Opciones específicas**
   - marca + presentación; imagenUrl externa opcional.
8. **Plantillas**
   - múltiples plantillas; etiqueta simple (sin carpetas).
9. **Compras**
   - crear compra (fecha + supermercado + selección de plantillas), lista consolidada, checklist, elección de opción específica, registro de qty/unit (opcional) y unitPrice (requerido si comprado), finalización con total pagado.
10. **Analítica**
   - promedio gasto mensual (mes calendario), top categorías, top productos (frecuencia por compras y por unidades), comparación de última observación por supermercado, historial compras, historial precios.

---

## C) Reglas de Negocio Críticas (Hard Constraints)
### C.1 Privacidad / Tenancy
- **RB-001:** Un usuario **solo** puede ver/modificar datos propios (supermercados, categorías, unidades, plantillas, productos, compras, observaciones).  
- **RB-002:** Todas las consultas y mutaciones deben filtrar por `ownerUserId` en capa de aplicación.

### C.2 Lista “Optimizada” (definición cerrada)
- **RB-010:** La lista de compra se construye consolidando productos de múltiples plantillas eliminando duplicados por **GenericItem canonical** (considerando aliases).
- **RB-011 (Sugerencia):** La recomendación de opción específica para un genérico en una compra se determina así:
  1) última opción comprada en ese supermercado (si existe),
  2) si no, última observación de precio en ese supermercado,
  3) si no, sin sugerencia.
- **RB-012:** La recomendación **no** se aplica automáticamente; solo se muestra.

### C.3 Categorías
- **RB-020:** Categoría primaria es **opcional**; si no existe, se usa “Sin categoría”.
- **RB-021:** Un producto puede tener múltiples categorías (tags), pero el resumen por categoría se basa en **categoría primaria** o “Sin categoría”.
- **RB-022:** Si hay conflicto de categorías entre plantillas para un mismo genérico, en V1 el sistema asigna “Sin categoría” para esa compra y **no bloquea** el flujo.

### C.4 Unidades / Cantidades
- **RB-030:** qty y unit son opcionales en PurchaseLine.
- **RB-031:** unit se elige del catálogo (base + user-defined). Prohibido unidad libre en texto (salvo nombre al crear una nueva unidad).
- **RB-032:** Para métricas de “unidades”, solo se agregan cantidades comparables por unidad; de lo contrario se segmenta por tipo de unidad.

### C.5 Precios e historial
- **RB-040:** El precio capturado es **unitPrice** (precio por unidad/pack).
- **RB-041:** Si una línea se marca como comprada, debe existir `unitPrice`.
- **RB-042:** El historial de precios (PriceObservation) se registra automáticamente **al finalizar** una compra, por cada línea comprada que tenga opción específica y unitPrice.
- **RB-043:** “Comparación de precios” se basa en la **última observación** por supermercado.

### C.6 Imágenes
- **RB-050:** Las imágenes se guardan como **URLs externas** (`imageUrl: string | null`). No hay subida ni storage interno.
- **RB-051:** Validación mínima: URL válida; recomendado `https`.

### C.7 Borrado
- **RB-060:** Borrado es **lógico** (`isDeleted = true`) para entidades referenciadas por históricos. Nunca se elimina físicamente en V1.

---

## D) Historias de Usuario (Gherkin — Given/When/Then)
> Nota: Cada historia está orientada a funcionalidad mínima verificable. La implementación debe incluir validaciones y errores explícitos.

### D.1 Autenticación — Registro
**Historia:** Como usuario, quiero registrarme con email y contraseña para acceder a mi espacio privado.  
**Criterios:**
- **Given** que el usuario está en la pantalla de registro,  
  **When** ingresa un email válido y una contraseña que cumple la política,  
  **Then** el sistema crea el usuario y lo autentica.
- **Given** que el email ya existe,  
  **When** el usuario intenta registrarse con ese email,  
  **Then** el sistema rechaza la operación con mensaje “Email ya registrado”.
- **Given** una contraseña que no cumple la política,  
  **When** el usuario intenta registrarse,  
  **Then** el sistema muestra el motivo de validación.

### D.2 Autenticación — Login
**Historia:** Como usuario, quiero iniciar sesión para ver mis datos.  
**Criterios:**
- **Given** que el usuario está en login,  
  **When** ingresa credenciales válidas,  
  **Then** el sistema inicia sesión y redirige al dashboard.
- **Given** credenciales inválidas,  
  **When** el usuario intenta iniciar sesión,  
  **Then** el sistema muestra “Credenciales inválidas” sin revelar si el email existe.

### D.3 Autenticación — Recuperación de contraseña
**Historia:** Como usuario, quiero recuperar mi contraseña por email.  
**Criterios:**
- **Given** que el usuario solicita recuperación con un email válido,  
  **When** confirma la solicitud,  
  **Then** el sistema genera un token de un solo uso con expiración y envía email (mock en V1).
- **Given** un token expirado o inválido,  
  **When** el usuario intenta cambiar la contraseña,  
  **Then** el sistema rechaza la operación.
- **Given** un token válido,  
  **When** el usuario define una nueva contraseña válida,  
  **Then** el sistema actualiza el hash y el token queda invalidado.

### D.4 Configuración — Moneda
**Historia:** Como usuario, quiero configurar mi moneda para que precios y reportes sean consistentes.  
**Criterios:**
- **Given** que el usuario no ha configurado moneda,  
  **When** usa el sistema por primera vez,  
  **Then** la moneda por defecto es USD.
- **Given** que el usuario cambia su moneda,  
  **When** guarda la configuración,  
  **Then** compras futuras usan esa moneda como default.

### D.5 Supermercados — CRUD
**Historia:** Como usuario, quiero administrar mis supermercados con nombre y dirección.  
**Criterios:**
- **Given** que el usuario autenticado está en “Supermercados”,  
  **When** crea un supermercado con nombre,  
  **Then** el sistema lo registra asociado a su usuario.
- **Given** un supermercado existente del usuario,  
  **When** lo edita,  
  **Then** se actualizan sus datos.
- **Given** un supermercado existente del usuario,  
  **When** lo elimina,  
  **Then** se marca como borrado lógico.

### D.6 Categorías — Mixtas
**Historia:** Como usuario, quiero usar categorías base y crear mis propias categorías.  
**Criterios:**
- **Given** categorías base pre-cargadas,  
  **When** el usuario lista categorías,  
  **Then** ve categorías base + sus categorías personales.
- **Given** que el usuario crea una categoría personal,  
  **When** la guarda,  
  **Then** queda disponible para asignarla a productos.

### D.7 Unidades — Catálogo ampliable
**Historia:** Como usuario, quiero usar unidades estándar y poder agregar nuevas.  
**Criterios:**
- **Given** unidades base (unidad, kg, g, L, ml, pack),  
  **When** el usuario lista unidades,  
  **Then** ve base + sus unidades personalizadas.
- **Given** que el usuario crea una nueva unidad,  
  **When** la guarda,  
  **Then** puede seleccionarla en compras y plantillas.

### D.8 Productos genéricos — CRUD + sinónimos
**Historia:** Como usuario, quiero administrar productos genéricos con alias para evitar duplicados.  
**Criterios:**
- **Given** que el usuario crea un producto genérico con nombre,  
  **When** lo guarda,  
  **Then** se registra con canonicalName y ownerUserId.
- **Given** que el usuario agrega un alias a un genérico,  
  **When** guarda el alias,  
  **Then** futuras búsquedas reconocen ese alias.
- **Given** que el usuario elimina un genérico usado en compras históricas,  
  **When** lo elimina,  
  **Then** el sistema aplica borrado lógico sin romper historiales.

### D.9 Opciones específicas — Marca/Presentación
**Historia:** Como usuario, quiero registrar opciones específicas (marca/presentación) para un genérico.  
**Criterios:**
- **Given** un genérico existente,  
  **When** el usuario crea una opción con marca y presentación,  
  **Then** queda asociada al genérico.
- **Given** que el usuario registra una imagen URL para la opción,  
  **When** la guarda,  
  **Then** el sistema conserva el enlace externo.

### D.10 Plantillas — CRUD + defaults
**Historia:** Como usuario, quiero crear plantillas de compra reutilizables.  
**Criterios:**
- **Given** que el usuario crea una plantilla con nombre y etiquetas,  
  **When** la guarda,  
  **Then** queda disponible para futuras compras.
- **Given** una plantilla existente,  
  **When** agrega productos genéricos con qty/unit por defecto (opcionales),  
  **Then** esos defaults se sugieren al crear una compra.

### D.11 Compra — Crear y consolidar lista
**Historia:** Como usuario, quiero crear una compra seleccionando supermercado y plantillas para obtener una lista consolidada.  
**Criterios:**
- **Given** que el usuario selecciona un supermercado y 1+ plantillas,  
  **When** crea la compra,  
  **Then** el sistema genera la lista consolidada sin duplicados por canonical/alias.
- **Given** que hay conflicto de categorías para un genérico,  
  **When** se consolida la lista,  
  **Then** el sistema asigna “Sin categoría” para esa compra y no bloquea.

### D.12 Compra — Checklist, cantidades, selección de opción, precio
**Historia:** Como usuario, quiero marcar productos comprados y registrar opción y precio por unidad/pack.  
**Criterios:**
- **Given** una compra en estado borrador,  
  **When** el usuario marca un ítem como comprado sin precio,  
  **Then** el sistema exige unitPrice para permitir el check final.
- **Given** una recomendación de opción específica,  
  **When** el usuario revisa el ítem,  
  **Then** el sistema muestra la recomendación pero no la aplica automáticamente.
- **Given** que el usuario no encuentra una opción adecuada,  
  **When** crea una nueva opción específica durante la compra,  
  **Then** la opción queda disponible para ese genérico y puede asignarse a la línea.

### D.13 Compra — Finalizar y generar observaciones de precio
**Historia:** Como usuario, quiero finalizar una compra con total pagado y que se actualice el historial de precios.  
**Criterios:**
- **Given** una compra con líneas compradas,  
  **When** el usuario finaliza e ingresa total pagado,  
  **Then** la compra cambia a “completed” y se registra el total.
- **Given** líneas compradas con opción específica y unitPrice,  
  **When** la compra se finaliza,  
  **Then** el sistema crea PriceObservations por cada línea aplicable con `observedAt = fecha de compra`.

### D.14 Analítica — Gastos y frecuencia
**Historia:** Como usuario, quiero ver estadísticas para entender mi gasto y hábitos.  
**Criterios:**
- **Given** compras completadas en varios meses,  
  **When** el usuario consulta “Promedio mensual”,  
  **Then** el sistema calcula por mes calendario.
- **Given** compras con líneas categorizadas,  
  **When** el usuario consulta “Top categorías”,  
  **Then** el sistema agrupa por categoría primaria o “Sin categoría”.
- **Given** historial de observaciones,  
  **When** el usuario compara precios por supermercado,  
  **Then** se muestra la última observación por supermercado.

---

## E) Modelo de Datos (Definición en texto)
> Persistencia V1: in-memory, pero el modelo debe ser persistible en DB real sin cambios en dominio.
> Todos los nombres de las tablas / entidades exlusivas de la funcionalidad de "Supermercado" en base de datos deben iniciar con el prefijo "market". Excpeto entidades genéricas que puedan ser reutilizadas en otros módulos futuros, por ejemplo "User".

### E.1 Convenciones
- `id`: UUID (string).
- `ownerUserId`: UUID del usuario propietario.
- `isDeleted`: boolean (borrado lógico).
- Fechas: ISO-8601 string.
- Moneda: `currencyCode` (ej. "USD").

### E.2 Entidades

#### User
- id: UUID
- email: string (unique)
- passwordHash: string
- defaultCurrencyCode: string (default "USD")
- createdAt: ISODate
- updatedAt: ISODate
- isDeleted: boolean

#### PasswordResetToken
- id: UUID
- userId: UUID
- tokenHash: string
- expiresAt: ISODate
- usedAt: ISODate | null
- createdAt: ISODate

#### Supermarket
- id: UUID
- ownerUserId: UUID
- name: string
- address: string | null
- createdAt: ISODate
- updatedAt: ISODate
- isDeleted: boolean

#### Category
- id: UUID
- ownerUserId: UUID | null   # null = base
- name: string
- createdAt: ISODate
- updatedAt: ISODate
- isDeleted: boolean

#### Unit
- id: UUID
- ownerUserId: UUID | null   # null = base
- name: string               # e.g. "kg", "unidad", "pack"
- symbol: string | null
- createdAt: ISODate
- updatedAt: ISODate
- isDeleted: boolean

#### GenericItem
- id: UUID
- ownerUserId: UUID
- canonicalName: string
- aliases: string[]          # sinónimos, gestionados por usuario
- primaryCategoryId: UUID | null
- secondaryCategoryIds: UUID[]
- imageUrl: string | null    # enlace externo
- createdAt: ISODate
- updatedAt: ISODate
- isDeleted: boolean

#### BrandProduct (Opción específica)
- id: UUID
- ownerUserId: UUID
- genericItemId: UUID
- brand: string              # e.g. "Bimbo"
- presentation: string       # e.g. "Integral 680g"
- imageUrl: string | null    # enlace externo
- createdAt: ISODate
- updatedAt: ISODate
- isDeleted: boolean

#### Template
- id: UUID
- ownerUserId: UUID
- name: string
- tags: string[]             # e.g. ["comida"], ["limpieza"]
- createdAt: ISODate
- updatedAt: ISODate
- isDeleted: boolean

#### TemplateItem
- id: UUID
- templateId: UUID
- genericItemId: UUID
- defaultQty: number | null
- defaultUnitId: UUID | null
- sortOrder: number | null

#### Purchase
- id: UUID
- ownerUserId: UUID
- supermarketId: UUID
- date: ISODate              # fecha de compra
- currencyCode: string       # por defecto del user al crear
- selectedTemplateIds: UUID[]
- totalPaid: number | null
- status: "draft" | "completed"
- createdAt: ISODate
- updatedAt: ISODate
- isDeleted: boolean

#### PurchaseLine
- id: UUID
- purchaseId: UUID
- genericItemId: UUID
- brandProductId: UUID | null
- qty: number | null
- unitId: UUID | null
- unitPrice: number | null           # requerido si checked=true
- checked: boolean
- lineAmountOverride: number | null  # opcional para cuadrar desglose cuando no hay qty
- note: string | null

#### PriceObservation
- id: UUID
- ownerUserId: UUID
- brandProductId: UUID
- supermarketId: UUID
- currencyCode: string
- unitPrice: number
- observedAt: ISODate
- sourcePurchaseId: UUID

---

## F) Reglas de Validación (mínimas, obligatorias)
- Email: formato válido.
- Password: mínimo 8 caracteres (recomendado), incluir al menos 1 letra y 1 número (ajustable).
- Números: `unitPrice > 0`, `qty > 0` cuando existan.
- URLs: parseables como URL, recomendado `https`.
- `checked=true` => `unitPrice` debe existir.
- `status="completed"` => `totalPaid` debe existir.

---

## G) Reglas de Cálculo (Analítica)
### G.1 Promedio mensual
- Agrupar compras `completed` por (año, mes) de `Purchase.date`.
- Promedio = promedio de `Purchase.totalPaid` de los meses con compras.

### G.2 Top categorías por gasto
- Para cada PurchaseLine comprada:
  - Si `lineAmountOverride` existe: usarlo como gasto.
  - Else si `qty` y `unitPrice` existen: gasto = qty * unitPrice.
  - Else: excluir de desglose (o marcar como “sin cálculo”).
- Agrupar por `GenericItem.primaryCategoryId` o “Sin categoría”.

### G.3 Frecuencia de productos
- Por compras: contar compras distintas donde aparece el genérico/marca.
- Por unidades: sumar `qty` por `unitId` (solo comparables).

### G.4 Comparación de precios por supermercado
- Para un BrandProduct:
  - obtener la última `PriceObservation` por supermercado (max observedAt).

---

## H) Arquitectura (Clean Architecture — lineamientos)
### H.1 Capas
- **Domain**: entidades y reglas (sin dependencias a Next.js).
- **Application**: casos de uso (servicios), validaciones de negocio, orquestación.
- **Infrastructure**: repositorios in-memory, envío de email “mock”, utilitarios.
- **Presentation**: Next.js routes, UI, handlers, DTO mapping.

### H.2 Principios
- Dominio no conoce infraestructura.
- Repositorios por interfaces.
- DTOs separados de entidades.
- Validaciones en Application (no solo en UI).

---

## I) Hard Constraints (NO se debe hacer)
- No almacenar contraseñas en texto plano.
- No permitir acceso a datos de otro usuario.
- No subir archivos en V1 (ticket, imágenes).
- No OCR ni extracción automática.
- No aplicar sugerencias automáticamente.
- No eliminar físicamente entidades referenciadas por históricos (usar borrado lógico).

---

## J) Datos Base Recomendados (seed V1)
### Categorías base sugeridas
- Carnes
- Lácteos
- Bebidas
- Panadería
- Abarrotes
- Limpieza
- Higiene personal
- Mascotas
- Congelados
- Snacks
- Sin categoría (virtual, no persistida o persistida como base)

### Unidades base sugeridas
- unidad
- pack
- kg
- g
- L
- ml

---

## K) Definición de “Done” (V1)
- Todas las historias D.1 a D.14 implementadas y verificables.
- Cobertura mínima de pruebas: casos felices + validaciones críticas (auth, tenancy, finalizar compra, price observations).
- UI responsive mobile-first.
- Repositorios in-memory intercambiables por DB real sin tocar dominio.

---
