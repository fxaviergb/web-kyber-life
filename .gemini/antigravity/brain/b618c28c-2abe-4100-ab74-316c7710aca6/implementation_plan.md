# Implementar Sistema Global de Etiquetas (Tags) para Transacciones

Este plan aborda la solicitud de agregar una sección de etiquetas (tags) reutilizables en las transacciones financieras.

## User Review Required
Por favor revisa el plan a continuación. Las etiquetas se almacenarán como texto en mayúsculas dentro de la columna `tags` que ya existe en la base de datos de transacciones. 

## Proposed Changes

### Database (Supabase RPC)
Para poder recomendar las etiquetas previas usadas por el usuario de forma rápida, crearé una función (RPC) en Supabase:
- `get_unique_financial_tags(p_user_id UUID)`: Esta función retornará de manera eficiente todas las etiquetas únicas que el usuario ya ha utilizado en cualquier transacción.

### Backend Actions & Service
- **`src/app/actions/financial-transactions.ts`**
  - [MODIFY] Agregar una nueva Server Action `getUniqueTagsAction()` para llamar a la función de Supabase y retornar la lista de etiquetas.

### Frontend Components

- **`src/components/ui/tag-input.tsx`** (o similar, en la carpeta de componentes comunes)
  - [NEW] Crear un componente interactivo de `TagInput`. 
  - Funcionalidad: Al presionar "Enter" o coma, se agrega la etiqueta. 
  - Autocompletado: Al escribir, mostrará una lista desplegable (popover o datalist) con las etiquetas sugeridas existentes, filtradas por lo que el usuario está escribiendo.
  - Formato: Siempre convertirá el texto a mayúsculas y evitará duplicados en el array local.

- **`src/presentation/financial/components/TransactionDetailClient.tsx`**
  - [MODIFY] Integrar el nuevo componente `TagInput` en el formulario de edición rápida.
  - [MODIFY] Asegurar de pasar el array de etiquetas `tags` en la función `handleSaveEdit`.

- **`src/presentation/financial/components/TransactionCard.tsx`**
  - [MODIFY] Mostrar las etiquetas de la transacción de forma visible en las tarjetas, respetando el diseño Mobile-First y los temas claro/oscuro de KyberLife.

## Verification Plan
### Manual Verification
1. Ingresar al módulo de transacciones financieras y abrir los detalles de una transacción.
2. Hacer clic en "Editar" e intentar agregar una nueva etiqueta (ej. "COMIDA"). Presionar "Enter" para que se fije.
3. Guardar los cambios y verificar que la tarjeta y el detalle muestren la etiqueta agregada.
4. Editar otra transacción y comenzar a escribir "CO...". El sistema debería recomendar "COMIDA". Seleccionarla y guardar.
5. Comprobar que en la base de datos se guarda en el arreglo de `tags`.
