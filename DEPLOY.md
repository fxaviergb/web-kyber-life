# Despliegue en Vercel - Guide

Este proyecto está listo para desplegarse en [Vercel](https://vercel.com). Sigue estos pasos para poner tu aplicación en línea.

## 1. Configuración del Repositorio

Asegúrate de que tu código esté actualizado en GitHub (ya realizado).

## 2. Despliegue en Vercel

1.  Inicia sesión en **Vercel**.
2.  Haz clic en **"Add New..."** -> **"Project"**.
3.  Selecciona el repositorio `web-kyber-life` (o el nombre que tenga en tu GitHub).
4.  **Framework Preset**: Next.js (se detectará automáticamente).
5.  **Environment Variables**:
    *   Este proyecto utiliza un repositorio **In-Memory** por defecto para la V1.
    *   No se requieren variables de entorno críticas para que la aplicación inicie.
    *   **Nota**: Al ser "In-Memory", *toda la data se reiniciará cada vez que se haga un nuevo despliegue o cuando Vercel recicle la función serverless (inactividad)*. Esto es el comportamiento esperado para la V1 Demo.

6.  Haz clic en **Deploy**.

## 3. Credenciales de Acceso

Una vez desplegado, el sistema inicializará automáticamente con un usuario de prueba:

*   **Email**: `test@test.com`
*   **Contraseña**: `test`

## 4. Notas Técnicas

*   **Persistencia**: La versión actual V1 no tiene base de datos persistente (Postgres/Supabase). Los datos viven en la memoria de la instancia.
*   **Imágenes**: Las imágenes subidas no se guardan en disco (no funcionaría en Vercel), se espera que sean URLs externas o se perderán.
*   **Node Version**: Se recomienda usar Node 18 o 20 (LTS).

## 5. Próximos Pasos (V2)

Para habilitar persistencia real:
1.  Configurar un proyecto en Supabase.
2.  Añadir variables `NEXT_PUBLIC_SUPABASE_URL` y `SUPABASE_ANON_KEY`.
3.  Cambiar la implementación de repositorios en `src/infrastructure/container.ts`.
