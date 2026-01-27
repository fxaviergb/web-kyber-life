# Kyber Life (V1)

Plataforma de control de procesos cotidianos de vida. Gestiona tus gastos, supermercados y gastos de manera eficiente para tomar mejores decisiones financieras.

## 🚀 Funcionalidades del Sistema

### 🔐 Autenticación y Seguridad
- **Login y Registro**: Sistema completo de acceso para usuarios.
- **Recuperación de Contraseña**: Flujo funcional para restablecer credenciales (`/auth/recover`).
- **Seguridad**: Implementación segura con hashing de contraseñas (`bcryptjs`) y manejo de sesiones vía cookies.

### 🛒 Gestión de Mercado
- **Supermercados**: Administra tus lugares de compra, direcciones y preferencias.
- **Productos (Items)**: Catálogo personalizable de productos, categorización y unidades de medida.
- **Listas de Compra**: Crea listas dinámicas, registra precios en tiempo real y calcula totales automáticamente.
- **Plantillas**: Guarda tus listas recurrentes para generar nuevas compras con un solo clic.

### 📊 Análisis y Control
- **Historial de Compras**: Registro detallado de todas tus transacciones pasadas.
- **Analytics**: Tableros visuales con gráficos de gasto mensual y distribución por categorías para entender tus hábitos de consumo.

### 👤 Perfil de Usuario
- Gestión centralizada de información personal y configuración de cuenta.

## 🛠️ Aspectos Técnicos

### Stack Tecnológico
- **Frontend**: [Next.js 16](https://nextjs.org/) (App Router) para una experiencia rápida y optimizada para SEO.
- **UI & Estilos**: [React 19](https://react.dev/), [TailwindCSS](https://tailwindcss.com/) v4 y componentes accesibles de [Shadcn/ui](https://ui.shadcn.com/).
- **Lenguaje**: TypeScript para un desarrollo robusto y seguro.
- **Gráficos**: Recharts para visualización de datos.

### Arquitectura
El proyecto sigue estrictamente los principios de **Clean Architecture** para asegurar mantenibilidad, escalabilidad y separación de responsabilidades:

- **`src/domain`**: Contiene las entidades del negocio y reglas independientes del framework.
- **`src/application`**: Define los casos de uso y la lógica de la aplicación.
- **`src/infrastructure`**: Implementaciones concretas de repositorios, adaptadores y servicios externos.
- **`src/presentation`**: Capa de interfaz de usuario (Componentes, Páginas, Validadores).

### Persistencia de Datos
> ⚠️ **Nota Importante (V1)**: Actualmente, el sistema utiliza repositorios **In-Memory**. Esto significa que **todos los datos creados se restablecerán** cada vez que se reinicie el servidor de la aplicación. Esta decisión facilita el despliegue rápido y pruebas de concepto.

## 🧪 Preparación y Pruebas

El proyecto cuenta con una suite de pruebas unitarias configurada con **Jest** y **React Testing Library**.

### Ejecutar Pruebas
Para validar la integridad del sistema y correr todos los tests disponibles:

```bash
npm test
```

## 🚀 Guía de Ejecución

### Requisitos Previos
- Node.js 18.17 o superior.
- npm (Node Package Manager).

### Instalación
Clona el repositorio e instala las dependencias:

```bash
npm install
```

### Modo Desarrollo
Para iniciar el entorno de desarrollo local con recarga en caliente:

```bash
npm run dev
```
La aplicación estará disponible en [http://localhost:3000](http://localhost:3000).

### Modo Producción
Para compilar y ejecutar la versión optimizada para producción:

1.  **Construir**:
    ```bash
    npm run build
    ```
    *(Nota: La configuración actual permite el build ignorando errores de linting no críticos).*

2.  **Iniciar**:
    ```bash
    npm start
    ```
