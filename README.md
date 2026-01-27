# KYBER LIFE (V1) - Personal Market Pilot

**Kyber Life** es una plataforma diseñada para optimizar la gestión de compras y consumo personal, actuando como un "Copiloto de Vida". Esta versión V1 se enfoca en la gestión de compras de supermercado, permitiendo el seguimiento de precios, control de gastos y análisis de hábitos de compra.

## 🚀 Funcionalidades Principales

### 🛒 Gestión de Mercado
*   **Listas de Compra Flexibles**: Crea listas de compras planificadas o inicia una "Compra Rápida" sobre la marcha.
*   **Checklist Interactivo**: Durante la compra, marca productos, ajusta precios reales y cantidades. El sistema calcula el total en tiempo real.
*   **Productos No Planeados**: Añade fácilmente productos que no estaban en tu lista original sin perder el flujo.

### 📝 Plantillas Inteligentes
*   **Reutilización**: Crea plantillas para compras recurrentes (ej. "Compra Semanal", "Asado del Domingo").
*   **Generación de Compras**: Inicia una nueva compra basándote en una plantilla predefinida con un solo clic.

### 📊 Analítica e Historial
*   **Historial de Compras**: Registro detallado de todas tus visitas al supermercado.
*   **Dashboard**: Visualización de métricas clave como gasto total, tendencias y productos más comprados.

### ⚙️ Configuración Maestra
*   **Gestión de Catálogo**: Administra Productos Genéricos, Categorías, Unidades de Medida y Supermercados.

---

## 🛠️ Aspectos Técnicos del Repositorio

Este proyecto está construido con una arquitectura moderna y escalable, priorizando la separación de responsabilidades y la experiencia de desarrollo.

### Stack Tecnológico
*   **Framework**: [Next.js 15+](https://nextjs.org/) (App Router, Server Actions).
*   **Lenguaje**: TypeScript.
*   **UI/UX**: Tailwind CSS 4, Shadcn/ui, Lucide React (Iconos).
*   **Testing**: Jest + React Testing Library.

### Arquitectura de Software
Implementamos **Clean Architecture** para garantizar mantenibilidad y testabilidad:
1.  **Domain (`src/domain`)**: Entidades centrales y reglas de negocio puras.
2.  **Application (`src/application`)**: Servicios y casos de uso que orquestan el dominio.
3.  **Infrastructure (`src/infrastructure`)**: Implementación concreta de repositorios.
    *   *Nota*: En la V1, utilizamos **Repositorios In-Memory**. Los datos persisten solo mientras la aplicación está en ejecución.
4.  **Presentation (`src/presentation`)**: Componentes de UI y Vistas.

### Despliegue (Vercel)
El proyecto está optimizado para desplegarse en **Vercel**.
*   Consulte `DEPLOY.md` para instrucciones detalladas.
*   Requiere Node.js 20+.

---

## 🏁 Inicio Rápido

1.  **Instalar dependencias**:
    ```bash
    npm install
    ```

2.  **Ejecutar en desarrollo**:
    ```bash
    npm run dev
    ```
    Accede a [http://localhost:3000](http://localhost:3000).

3.  **Usuario de Prueba**:
    El sistema inicia con un seed de datos básico.
    *   **Email**: `test@test.com`
    *   **Password**: `test`

---

> **Nota Importante V1**: Al utilizar almacenamiento en memoria, **todos los datos se restablecen al reiniciar el servidor**. Esta versión está destinada a demostraciones funcionales y validación de flujos de UI/UX.
