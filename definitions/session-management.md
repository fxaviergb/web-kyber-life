# Session Management — Definición y Estrategia

**KyberLife · Versión 1.0 · Febrero 2026**

---

## 1. Objetivo

Implementar un sistema de control de sesión e inactividad para el ecosistema KyberLife que sea **adaptable a múltiples fuentes de datos** (`SUPABASE`, `MEMORY`, `MOCK`) y que garantice la seguridad del usuario mediante el cierre automático de sesiones inactivas.

---

## 2. Patrón de Diseño: Strategy

El sistema utiliza el **Patrón de Diseño Strategy** para desacoplar la lógica de sesión de la fuente de datos activa.

```
«interface»
ISessionStrategy
─────────────────────────────
+ logout(): Promise<void>
+ checkAndRefreshSession(): Promise<{ shouldLogout: boolean }>
        ▲                        ▲
        │                        │
SupabaseSessionStrategy    MockSessionStrategy
(DATA_SOURCE=SUPABASE)     (DATA_SOURCE=MEMORY|MOCK)
```

### 2.1 Interfaz Común (`ISessionStrategy`)

Cada estrategia debe implementar dos métodos:

| Método | Propósito |
|--------|-----------|
| `logout()` | Cierra la sesión en la fuente de datos y redirige a `/auth/login`. Además emite un evento `localStorage` para sincronizar otras pestañas. |
| `checkAndRefreshSession()` | Verifica si la sesión sigue vigente. Retorna `{ shouldLogout: true }` si debe forzarse el cierre. |

---

## 3. Estrategias Implementadas

### 3.1 `SupabaseSessionStrategy`
**Activada cuando:** `NEXT_PUBLIC_AUTH_STRATEGY === 'SUPABASE'`

**`logout()`**
1. Escribe en `localStorage[kyber_logout_broadcast]` para notificar otras pestañas.
2. Llama a `supabase.auth.signOut()` dentro de un `try/catch`.
3. Navega a `/auth/login` vía `router.replace()` en el bloque `finally` (se ejecuta **siempre**, incluso si Supabase lanza excepción).
4. Fallback: `window.location.replace('/auth/login')` si el router falla.

**`checkAndRefreshSession()` — Proactive Refresh**
1. Obtiene la sesión actual con `supabase.auth.getSession()`.
2. Calcula el tiempo restante del JWT (`expires_at`).
3. Si quedan **menos de 5 minutos**, llama a `supabase.auth.refreshSession()`.
4. No fuerza logout en errores de red (retorna `shouldLogout: false` para ser resiliente).

### 3.2 `MockSessionStrategy`
**Activada cuando:** `NEXT_PUBLIC_AUTH_STRATEGY === 'MEMORY' | 'MOCK'`

**`logout()`**
1. Escribe en `localStorage[kyber_logout_broadcast]` para notificar otras pestañas.
2. Elimina `localStorage[kyber_mock_token_expiry]`.
3. Llama a `POST /api/auth/logout` vía `fetch` para borrar la cookie `kyber_session` del servidor.
4. Navega a `/auth/login`.

**`checkAndRefreshSession()`**
1. Lee el timestamp de expiración en `localStorage[kyber_mock_token_expiry]`.
2. Si el timestamp existe y ya pasó, retorna `{ shouldLogout: true }`.
3. Si no existe el registro, considera la sesión válida (las sesiones MEMORY/MOCK son cookie-based sin TTL explícito por defecto).

### 3.3 `SessionStrategyFactory`
Función pura que recibe el `router` de Next.js y retorna la estrategia correcta:

```typescript
function createSessionStrategy(router): ISessionStrategy {
  if (process.env.NEXT_PUBLIC_AUTH_STRATEGY === 'SUPABASE') {
    return new SupabaseSessionStrategy(createClient(), router);
  }
  return new MockSessionStrategy(router);
}
```

---

## 4. Hook: `useSessionGuard`

Hook central que orquesta toda la lógica de inactividad.

### 4.1 Variables de Configuración

| Parámetro | Default | Env var override |
|-----------|---------|-----------------|
| `inactivityLimitMs` | `1800000` (30 min) | `NEXT_PUBLIC_SESSION_TIMEOUT_MS` |
| `gracePeriodMs` | `30000` (30 seg) | — (hardcoded por diseño) |
| Intervalo de refresh proactivo | `240000` (4 min) | — (hardcoded por diseño) |

### 4.2 Eventos de Actividad Rastreados

```
mousemove · keydown · click · touchstart · scroll
```

### 4.3 Flujo de Timers

```
Usuario activo
     │
     ▼
[resetTimers()]
     │
     ├─ warningTimer → dispara a los (inactivityLimit - gracePeriod)
     │                 → isInGracePeriodRef = true
     │                 → setShowWarning(true) + startCountdown()
     │
     └─ logoutTimer  → dispara a los inactivityLimit
                      → handleLogout() → strategy.logout()
```

### 4.4 Guard de Grace Period

`isInGracePeriodRef` es un `useRef` booleano que **bloquea los listeners de actividad** mientras el modal está visible.  
Sin este guard, cualquier movimiento del mouse cerraría el modal silenciosamente.

| Acción | Efecto sobre `isInGracePeriodRef` |
|--------|----------------------------------|
| `warningTimer` se dispara | `true` → listeners bloqueados |
| Usuario hace clic en **Extender** | `false` → timers reseteados, modal cerrado |
| Usuario hace clic en **Cerrar sesión** | `handleLogout()` ejecutado |
| `logoutTimer` se dispara | `handleLogout()` ejecutado |

### 4.5 Sincronización entre Pestañas

Mediante la **Storage API** (`window.addEventListener('storage', ...)`):

```
Tab A: logout()
  └─ localStorage.setItem('kyber_logout_broadcast', timestamp)
       │
       ▼
Tab B: storage event detectado
  └─ window.location.replace('/auth/login')
```

> El listener solo reacciona si `event.key === 'kyber_logout_broadcast'` y el tab no está ya en proceso de cierre (`isLoggingOutRef.current === false`).

### 4.6 Limpieza de Recursos (Anti Memory Leak)

El `useEffect` retorna una función de cleanup que elimina:
- `warningTimer` (setTimeout)
- `logoutTimer` (setTimeout)
- `countdownInterval` (setInterval)
- `proactiveCheckInterval` (setInterval)
- Todos los `window.addEventListener` de actividad
- El `window.addEventListener('storage')`

---

## 5. Capa de UI

### `SessionExpiryModal`
Modal de advertencia renderizado mediante renderizado condicional en el Provider.

**Características:**
- Overlay con `backdrop-filter: blur(4px)` y fondo semitransparente.
- Ícono y colores dinámicos: modo **normal** (índigo) → modo **urgente** (rojo) cuando `secondsRemaining <= 10`.
- Countdown en tiempo real (`secondsRemaining` decrementado por `countdownInterval`).
- Usa exclusivamente **CSS variables** del Design System de KyberLife (`--bg-secondary`, `--accent-primary`, etc.) para compatibilidad con modo oscuro/claro.
- `z-index: 9999` para garantizar visibilidad sobre cualquier componente.

### `SessionGuardProvider`
Componente Provider que:
1. Instancia la estrategia una sola vez (`useMemo`).
2. Ejecuta el hook `useSessionGuard`.
3. Renderiza `<SessionExpiryModal>` condicionalmente.

Está montado en `AppLayout`, por lo que solo actúa en **rutas protegidas** (dashboard, market, profile).

---

## 6. Variables de Entorno

| Variable | Contexto | Descripción |
|----------|----------|-------------|
| `DATA_SOURCE` | Servidor | Fuente de datos: `SUPABASE` \| `MEMORY` \| `MOCK` |
| `NEXT_PUBLIC_AUTH_STRATEGY` | Cliente | Debe coincidir con `DATA_SOURCE` |
| `NEXT_PUBLIC_SESSION_TIMEOUT_MS` | Cliente | Timeout de inactividad en ms. Default: `1800000` |

> **Regla:** Las variables de entorno sin prefijo `NEXT_PUBLIC_` **no son accesibles** en Client Components (`"use client"`). Por eso coexisten `DATA_SOURCE` (servidor) y `NEXT_PUBLIC_AUTH_STRATEGY` (cliente) con el mismo valor.

---

## 7. Archivos del Sistema

```
src/
├── lib/session/
│   ├── types.ts                      ← Interfaz ISessionStrategy + constantes
│   ├── supabase-session-strategy.ts  ← Estrategia Supabase
│   ├── mock-session-strategy.ts      ← Estrategia Memory/Mock
│   └── session-strategy-factory.ts   ← Factory selector
│
├── hooks/
│   └── use-session-guard.ts          ← Hook central de inactividad
│
├── presentation/components/session/
│   ├── SessionExpiryModal.tsx        ← Modal de advertencia
│   └── SessionGuardProvider.tsx      ← Provider integrador
│
└── app/api/auth/logout/
    └── route.ts                      ← POST endpoint para borrar cookie (mock)
```

---

## 8. Diagrama de Flujo General

```
Usuario autenticado en ruta protegida
          │
          ▼
    AppLayout monta
   SessionGuardProvider
          │
          ▼
  createSessionStrategy()
  lee NEXT_PUBLIC_AUTH_STRATEGY
          │
     ┌────┴─────┐
   SUPABASE   MEMORY/MOCK
     │              │
  SupabaseStrategy  MockStrategy
     └────┬─────┘
          │
          ▼
   useSessionGuard(strategy)
          │
    ┌─────┴──────────────────────────────┐
    │                                    │
Activity Listeners             Proactive Check (4 min)
(mousemove, click, ...)        checkAndRefreshSession()
    │                                    │
resetTimers()             shouldLogout? ─→ handleLogout()
    │
    ├─ [t = limit - 30s] → showWarning = true
    │                       isInGracePeriodRef = true
    │                       startCountdown()
    │
    └─ [t = limit]       → handleLogout()
                               │
                          strategy.logout()
                               │
                    ┌──────────┴──────────┐
                  Supabase              Mock
              signOut() SDK      DELETE kyber_session cookie
                    └──────────┬──────────┘
                          router.replace('/auth/login')
                          + localStorage broadcast → otras pestañas
```
