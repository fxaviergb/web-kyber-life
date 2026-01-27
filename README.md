# KYBER LIFE (V1)

Plataforma de Optimización de Mercado Personal.

## Requisitos
- Node.js 18+
- npm

## Instalación

```bash
npm install
```

## Ejecución (Modo Desarrollo)

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## Guía de Uso Rápida

1.  **Registro**: Al ser una demo con base de datos en memoria, **debes registrarte nuevamente** cada vez que reinicias el servidor. Ve a "No tienes cuenta? Regístrate".
2.  **Dashboard**: Verás tu panel principal.
3.  **Configuración**:
    -   Ve a **Supermercados** y crea uno (ej. "Walmart").
    -   Ve a **Items** y crea productos si lo deseas, o úsalos al vuelo.
4.  **Compra**:
    -   Ve a **Nueva Compra**.
    -   Selecciona el Supermercado.
    -   En la **Lista de Compra**, añade items, marca precios y cantidades.
    -   Click en **Finalizar** para guardar el historial.

## Tests

Para ejecutar las pruebas unitarias:

```bash
npm test
```

## Arquitectura

Este proyecto sigue **Clean Architecture**:
-   `src/domain`: Entidades y reglas de negocio.
-   `src/application`: Casos de uso.
-   `src/infrastructure`: Repositorios (In-Memory).
-   `src/presentation`: UI Components (Shadcn/ui).

> **Nota**: Los datos se perderán al detener el servidor (In-Memory Persistence).
