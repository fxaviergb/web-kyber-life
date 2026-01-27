# Especificación de Diseño (UI/UX) — KYBER LIFE (V1)
**Referencia visual:** Dark UI + gradientes + tarjetas flotantes, inspirado en los 2 diseños adjuntos (sidebar + listas tipo “inbox” + panel de detalle / dashboard móvil con tarjetas y charts).  
**Objetivo:** Definir un sistema de diseño y plantillas de pantallas para implementar una UI consistente, mobile-first, responsive y optimizada para productividad.

---

## 1) Principios de Diseño
1. **Mobile-first real:** todo el flujo crítico (crear compra, checklist, finalizar) debe ser usable con una mano.
2. **Dark-first + acentos neon:** superficies oscuras con acentos vivos (mint/coral/violet) para estados y highlights.
3. **Jerarquía por tarjetas:** información en “cards” con esquinas redondeadas, sombras suaves y separación clara.
4. **Doble navegación:**  
   - **Sidebar** (desktop/tablet) para módulos.  
   - **Bottom navigation** (mobile) para accesos principales.
5. **Contexto visible:** en desktop, preferir **lista + detalle** (patrón tipo correo). En mobile, preferir **stack** (pantallas apiladas).
6. **Cero fricción en compras:** la UI prioriza check rápido, edición inline (qty, unidad, precio) y sugerencias visibles sin imponer.

---

## 2) Stack de UI (Estricto)
- **Next.js (App Router) + TypeScript**
- **Tailwind CSS** (tokens definidos en este documento)
- **shadcn/ui + Radix UI** (componentes accesibles)
- **Iconos:** `lucide-react`
- **Charts:** `recharts` (línea, barras, donut)
- **Tipografía:** `Inter` (fallback: system-ui)

> Nota: Este stack es parte de la especificación de diseño para evitar mezclas de librerías y estilos.

---

## 3) Design Tokens (Sistema de Diseño)

### 3.1 Colores (Dark + Acentos)
**Fondos y superficies**
- `--bg-0`: `#0B0F24` (fondo global)
- `--bg-1`: `#10163A` (surface principal)
- `--bg-2`: `#151D4A` (surface elevada)
- `--glass`: `rgba(255,255,255,0.06)` (glass overlay)

**Texto**
- `--text-1`: `#E9ECFF` (texto primario)
- `--text-2`: `#A7B0D9` (muted)
- `--text-3`: `#7F88B8` (helper/labels)

**Bordes**
- `--border-1`: `rgba(255,255,255,0.10)`
- `--border-2`: `rgba(255,255,255,0.06)`

**Acentos (inspirados en referencias)**
- `--accent-mint`: `#2EE59D` (acciones positivas / seleccionado)
- `--accent-coral`: `#FF7A5C` (acciones / warning suave)
- `--accent-violet`: `#8A5CFF` (info / enfoque / navegación activa)
- `--accent-magenta`: `#E10BA7` (destacados / tags)
- `--accent-cyan`: `#2DD4FF` (data highlights)

**Estados**
- `--success`: `#2EE59D`
- `--warning`: `#FFB020`
- `--error`: `#FF4D6D`
- `--info`: `#2DD4FF`

**Gradientes (hero / fondos)**
- `--grad-hero`: `linear-gradient(135deg, #FF7A5C 0%, #E10BA7 45%, #8A5CFF 100%)`

### 3.2 Tipografía
- **Base:** Inter
- **Escala:**
  - H1: 28–32 / 600
  - H2: 22–24 / 600
  - H3: 18–20 / 600
  - Body: 14–16 / 400–500
  - Caption: 12–13 / 400
- **Line-height:** 1.3 headings / 1.5 body
- **Regla:** máximas 2 familias tipográficas (Inter + monospace para IDs opcional).

### 3.3 Espaciado y grid
- **Espaciado base:** 4px
- Escala recomendada: 4 / 8 / 12 / 16 / 20 / 24 / 32 / 40
- **Layout:** 12-column grid en desktop; stack en mobile.

### 3.4 Radios y sombras (look “soft”)
- `--radius-sm`: 12px
- `--radius-md`: 16px
- `--radius-lg`: 24px
- Sombras:
  - `--shadow-1`: blur 12–16 (suave)
  - `--shadow-2`: blur 20–28 (tarjetas flotantes)
- **Borde:** 1px `--border-2` para surfaces; 1px `--border-1` para foco/selección.

### 3.5 Motion (micro-interacciones)
- Duración: 160–220ms
- Easing: `cubic-bezier(0.2, 0.8, 0.2, 1)`
- Hover: elevar 2–4px + sombra leve
- Toggle/check: animación “snap” suave (sin rebotes largos)

---

## 4) Componentes UI (Catálogo)

### 4.1 Navegación
**Sidebar (desktop/tablet)**
- Ancho: 280px expandido / 72px colapsado
- Secciones:
  - Perfil (avatar, email)
  - Módulos (Dashboard, Compras, Plantillas, Productos, Supermercados, Analítica, Configuración)
  - Acción primaria (botón “+ Nuevo” contextual)
- Estados:
  - Activo: icon + label en `--accent-mint` o `--accent-violet`
  - Hover: fondo `--glass`

**Bottom Nav (mobile)**
- 4–5 tabs máx: Dashboard / Compras / Plantillas / Analítica / Config
- Indicador activo: underline o pill con `--accent-violet`

### 4.2 Cards
- Card base: fondo `--bg-1`, borde `--border-2`, radio `--radius-md`, shadow `--shadow-1`
- Card “accent”: borde o glow suave con `--accent-*`
- Usos: métricas, listas, resumen de compra, entidad detalle

### 4.3 Listas tipo “Inbox”
- Item de lista con:
  - icon/avatar (opcional)
  - título + meta (fecha, tags)
  - estado (badge)
- Selección: resalta item con background y borde `--accent-mint` (similar a referencia 1)

### 4.4 Formularios (Inputs)
- Input: fondo `--bg-2`, borde `--border-2`, foco `--accent-violet`
- Errores: texto `--error`, borde `--error` con opacidad
- Reglas:
  - labels arriba (no placeholders como label)
  - helper text bajo input
- Controles:
  - Text, Number, Select, Combobox (búsqueda), Toggle, Checkbox, Date picker

### 4.5 Badges / Chips
- Categoría/tag: pill con `--glass`, borde `--border-2`
- Estado:
  - success: mint
  - warning: coral/amarillo
  - info: cyan/violet

### 4.6 Tabla ligera (desktop)
- Para historiales: tabla con filas tipo card (row-card)
- En mobile: reemplazar por cards apiladas

### 4.7 Checklist (flujo compra)
- Cada línea:
  - checkbox
  - nombre genérico
  - recomendación (badge “Recomendado” + opción sugerida)
  - qty (opcional), unidad (opcional), precio unitario (requerido si comprado)
  - acción: “Elegir opción” / “Crear opción”
- Interacción: edición inline sin modales para campos básicos

### 4.8 Modales / Drawers
- En mobile: preferir **drawer** inferior para seleccionar opción específica
- En desktop: modal centrado o panel derecho (según contexto)

### 4.9 Notificaciones
- Toasts:
  - Guardado exitoso (mint)
  - Error (rojo)
  - Advertencia (coral)
- No usar alerts bloqueantes salvo acciones destructivas

### 4.10 Charts (Analítica)
- Line chart: gasto mensual
- Bar chart: top categorías
- Donut: distribución por categoría
- Mini sparklines en cards para tendencias

---

## 5) Layouts por Breakpoint (Responsive)

### 5.1 Breakpoints
- `sm`: 360–640 (mobile)
- `md`: 641–1024 (tablet)
- `lg`: 1025–1440 (desktop)
- `xl`: 1441+ (wide)

### 5.2 Plantillas de Layout
**Desktop (patrón tipo “correo” inspirado en ref 1)**
- **Columna 1:** Sidebar navegación
- **Columna 2:** Lista (Plantillas / Compras / Productos) con búsqueda y filtros
- **Columna 3:** Panel de detalle (editar entidad / resumen / insights)
- Opcional (wide): mini panel de “Insights” (cards pequeñas)

**Mobile (patrón dashboard inspirado en ref 2)**
- Header compacto + tabs
- Cards métricas arriba
- Listas como cards
- Bottom nav fija

---

## 6) Especificación de Pantallas (V1)

### 6.1 Login / Registro
- Fondo: gradiente hero suave (como referencias), con card central (glass)
- Campos: email, password
- Recuperación: link “Olvidé mi contraseña”
- Errores: inline + toast

### 6.2 Dashboard
**Secciones**
- Cards: “Gasto este mes”, “Promedio mensual”, “Compras realizadas”, “Top categoría”
- Gráfica principal: línea gasto mensual
- Lista reciente: últimas compras (estilo inbox)

### 6.3 Supermercados (List + Detail)
- Lista izquierda: supermercados + dirección corta
- Detail derecha: formulario edición + botón eliminar (borrado lógico)
- CTA: “Nuevo supermercado”

### 6.4 Categorías / Unidades
- Vista de catálogo (cards o tabla ligera)
- Base + personal:
  - Badge “Base” (violet) vs “Personal” (mint)
- Crear nueva (modal/drawer)

### 6.5 Productos Genéricos
- Lista: búsqueda + filtros por categoría/tag
- Detalle:
  - canonicalName
  - aliases (chips editables)
  - categoría primaria (select opcional)
  - tags (multi-select)
  - imageUrl (input + preview)
- Acciones:
  - “Unir / agregar alias” como acción guiada (evitar duplicados)

### 6.6 Opciones Específicas (BrandProduct)
- Dentro del detalle de un genérico:
  - lista de opciones específicas (cards)
  - cada card: marca + presentación + imageUrl preview
  - sub-sección: “Últimos precios por supermercado” (última observación)

### 6.7 Plantillas
- Lista de plantillas (cards tipo inbox)
- Detalle de plantilla:
  - nombre
  - tags (chips)
  - lista de items (genéricos)
  - defaults qty/unit opcionales
- CTA: “Agregar producto” (combobox búsqueda)

### 6.8 Compra (Flujo principal)
**Paso 1: Crear compra**
- Selección:
  - supermercado (select)
  - fecha (default hoy)
  - plantillas (multi-select)
- CTA: “Generar lista”

**Paso 2: Lista consolidada + checklist**
- Agrupación por categoría primaria; si no: “Sin categoría”
- Cada item:
  - checkbox
  - recomendación visible (badge “Recomendado”)
  - selector de opción específica (drawer/modal)
  - qty/unit (opcionales)
  - unitPrice (requerido si checked=true)
- Acciones rápidas:
  - “+ Agregar producto no planificado” (crea genérico y permite agregar a una plantilla elegida)
  - “Editar plantillas seleccionadas” (atajo)

**Paso 3: Finalizar**
- Campo: total pagado (requerido)
- Resumen:
  - gasto por categoría (cuando haya datos calculables)
  - lista de comprados vs pendientes
- CTA: “Finalizar compra” (cambia a completed)

### 6.9 Analítica
- Tabs:
  - Gastos (mensual)
  - Categorías
  - Productos (frecuencia)
  - Precios (comparación por supermercado)
- UI de filtros:
  - rango de fechas
  - supermercado
  - categoría
  - producto

### 6.10 Configuración de Usuario
- Perfil básico
- Moneda (default USD)
- Cambiar contraseña

---

## 7) Estados y UX “No felices”
### 7.1 Empty states
- Sin plantillas: card con CTA “Crear plantilla”
- Sin compras: “Crea tu primera compra”
- Sin opciones específicas: “Crea una opción (marca/presentación)”

### 7.2 Loading
- Skeletons en listas (inbox)
- Spinners solo en acciones cortas (guardar)

### 7.3 Error
- Mensajes concretos y accionables
- Nunca mostrar trazas técnicas

---

## 8) Accesibilidad (Obligatoria)
- Contraste mínimo AA para texto (especialmente sobre dark surfaces)
- Navegación por teclado completa (Radix/shadcn)
- Focus ring visible con `--accent-violet`
- Labels explícitas en inputs (no depender de placeholder)
- Tamaño mínimo de targets en mobile: 44px

---

## 9) Contenido y Microcopy (Reglas)
- Títulos cortos (1 línea)
- CTA con verbos claros: “Crear”, “Guardar”, “Finalizar”
- Sugerencias siempre como recomendación (“Recomendado”) y no como selección

---

## 10) Entregables UI (para implementación)
1. **Tokens Tailwind** (variables CSS / theme config) basados en sección 3
2. **Componentes shadcn**: Sidebar, Card, Badge, Input, Select, Combobox, Drawer, Toast, Table-lite, CheckboxRow
3. **Plantillas de layout**: Desktop 3-panel + Mobile bottom-nav
4. **Rutas UI sugeridas (App Router)**:
   - `/auth/login`, `/auth/register`, `/auth/forgot`
   - `market/dashboard`
   - `market/purchases`, `market/purchases/new`, `market/purchases/[id]`
   - `market/templates`, `market/templates/[id]`
   - `market/items`, `market/items/[id]`
   - `market/analytics`
   - `market/settings`

---
