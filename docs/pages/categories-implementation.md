# Categories Implementation - Task List

> This document provides a detailed task list for implementing the Categories module. Follow these steps in order to ensure clean, consistent code.

---

## Backend Admin UI (Next.js)

**Location**: `apps/backend/src/app/categories/`

### Phase 1: Setup File Structure

- [ ] Create directory structure:
  ```
  categories/
  ├── page.tsx
  ├── new/
  │   └── page.tsx
  ├── [id]/
  │   ├── page.tsx
  │   └── edit/
  │       └── page.tsx
  └── _component/
      ├── index.ts
      ├── types.ts
      ├── utils.ts
      ├── columns.tsx
      ├── _hooks/
      │   ├── index.ts
      │   ├── use-category-form.ts
      │   ├── use-categories-actions.ts
      │   └── use-categories-filters.ts
      ├── _query/
      │   ├── index.ts
      │   └── use-categories-queries.ts
      ├── _table/
      │   ├── index.ts
      │   ├── categories-table.tsx
      │   └── categories-trash-table.tsx
      ├── _form/
      │   ├── index.ts
      │   └── category-form-shell.tsx
      └── _alert-dialog/
          ├── index.ts
          └── categories-confirm-dialog.tsx
  ```

### Phase 2: Define Types (`_component/types.ts`)

- [ ] Export shared types from `@workspace/api-client`:
  - `Category` (from shared package)
  - `CreateCategoryInput`
  - `UpdateCategoryInput`

- [ ] Define local UI types:
  ```typescript
  export interface CategoryRow {
    id: string;
    name: string;
    slug: string;
    parentId: string | null;
    parentName: string | null;
    description: string | null;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
    icon: string | null;
    sortOrder: number;
    _count: { children: number };
    postCount: number;
    subRows?: CategoryRow[];
  }

  export interface CategoryConfirmAction {
    kind: "delete" | "restore" | "purge";
    row: CategoryRow;
  }

  export interface FormState {
    id?: string;
    name: string;
    slug: string;
    description: string;
    icon: string;
    sortOrder: number;
    parentId: string;
  }
  ```

### Phase 3: Create Utility Functions (`_component/utils.ts`)

- [ ] Implement `slugify(text)`: Convert text to URL-friendly slug
- [ ] Implement `buildCategoryOptionTree(rows)`: Build hierarchical tree for dropdowns
- [ ] Implement `buildCategoriesFilterQuery(filters)`: Convert column filters to API query
- [ ] Implement `formatDateTime(date)`: Format date/time for display
- [ ] Implement `buildCategoryPayload(values)`: Prepare form data for API submission

### Phase 4: Create Form Hook (`_component/_hooks/use-category-form.ts`)

- [ ] Define schema with zod:
  ```typescript
  export const categoryFormSchema = z.object({
    name: z.string().min(1, "Tên danh mục không được để trống"),
    slug: z.string(),
    description: z.string(),
    icon: z.string(),
    sortOrder: z.coerce.number(),
    parentId: z.string(),
  });
  ```

- [ ] Define default values: `EMPTY_VALUES` object
- [ ] Export `useCategoryForm()` hook using `useForm` with zodResolver
- [ ] Export `buildCategoryPayload()` helper

### Phase 5: Create Query Hooks (`_component/_query/use-categories-queries.ts`)

- [ ] Implement `useCategoriesQuery(params)`:
  - Fetch categories with pagination, search, filters
  - Use `useQuery` from React Query
  - Cache key: `["admin", "categories"]`

- [ ] Implement `useTrashQuery(params)`:
  - Fetch trashed categories
  - Cache key: `["admin", "categories", "trash"]`

- [ ] Implement `useCategoryDetailQuery(api, id)`:
  - Fetch single category with children and posts
  - Cache key: `["admin", "categories", id]`

- [ ] Implement `useCategoriesOptionsQuery(column, search, limit)`:
  - Fetch category tree for dropdowns
  - Cache key: `["admin", "categories", "options"]`

### Phase 6: Create Table Columns (`_component/columns.tsx`)

- [ ] Define `CategoryColumnsProps` interface with `onEdit`, `onDelete` callbacks
- [ ] Implement `getCategoryColumns(props)`:
  - Column: Name (with tree indentation)
  - Column: Slug
  - Column: Post count
  - Column: Parent category
  - Column: Actions (View, Edit, Delete/Restore)
- [ ] Use Lucide icons for action buttons
- [ ] Use Badge for status indicators
- [ ] Add meta properties for filtering

### Phase 7: Create Table Components (`_component/_table/`)

- [ ] Create `categories-table.tsx`:
  - Wrap `AdminDataTable` component
  - Configure data, columns, pagination
  - Add filters, row selection, bulk actions
  - Add refresh and clear filter buttons

- [ ] Create `categories-trash-table.tsx`:
  - Similar to categories-table but for trash
  - Show restore and purge actions

- [ ] Export both from `index.ts`

### Phase 8: Create Form Shell (`_component/_form/category-form-shell.tsx`)

- [ ] Define `CategoryFormShellProps` interface:
  ```typescript
  export interface CategoryFormShellProps {
    form: UseFormReturn<CategoryFormValues>;
    onSubmit: (values: CategoryFormValues) => Promise<void>;
    submitting: boolean;
    editingId: string | null;
    onBack: () => void;
    onReset: () => void;
  }
  ```

- [ ] Implement form layout with Card components
- [ ] Use `Controller` from react-hook-form for controlled inputs
- [ ] Include fields: name, slug, description, icon, sortOrder, parentId
- [ ] Add character count badges
- [ ] Add validation error messages
- [ ] Add navigation buttons (Back, Reset, Save)

### Phase 9: Create Confirm Dialog (`_component/_alert-dialog/categories-confirm-dialog.tsx`)

- [ ] Define props interface with `confirmAction`, `deleteMutation`, etc.
- [ ] Use `AdminConfirmActionDialog` shared component
- [ ] Handle delete, restore, purge actions
- [ ] Show appropriate title, description, icon based on action type

### Phase 10: Create Main Page (`page.tsx`)

- [ ] Import all necessary components and hooks
- [ ] Set up state:
  - Main tab (list/trash)
  - Global filter (search)
  - Column filters
  - Row selection
  - Confirm action

- [ ] Use query hooks:
  - `useCategoriesQuery` for list
  - `useTrashQuery` for trash
  - `useCategoriesOptionsQuery` for parent dropdown

- [ ] Use mutations for delete, restore, purge

- [ ] Implement `buildCategoryTree()`:
  - Map categories by ID
  - Link children to parents
  - Sort by name (Vietnamese locale)
  - Recursive sorting for nested children

- [ ] Render page with:
  - Page header with title and description
  - Tabs (List, Trash)
  - CategoriesTable or CategoriesTrashTable based on tab
  - CategoriesConfirmDialog

- [ ] Add permission checks with `AdminPageGuard`

### Phase 11: Create New Page (`new/page.tsx`)

- [ ] Use `CategoryFormShell` component
- [ ] Use `useCategoryForm` hook
- [ ] Implement create mutation with `useMutation`
- [ ] On success: invalidate cache, show toast, navigate to list
- [ ] On error: show error toast
- [ ] Add permission guard

### Phase 12: Create Edit Page (`[id]/edit/page.tsx`)

- [ ] Fetch category detail with `useCategoryDetailQuery`
- [ ] Populate form with existing data
- [ ] Use `CategoryFormShell` component
- [ ] Implement update mutation
- [ ] Handle loading and error states
- [ ] Add permission guard

### Phase 13: Create Detail Page (`[id]/page.tsx`)

- [ ] Fetch category detail with children and posts
- [ ] Display information in 2-column layout:
  - Left (col-span-2): Category info, children, related posts
  - Right (col-span-1): Time info, hierarchy info
- [ ] Add navigation buttons (Back, Edit)
- [ ] Handle loading and error states
- [ ] Add permission guard

### Phase 14: Update Exports (`_component/index.ts`)

- [ ] Re-export shared types from `@workspace/api-client`
- [ ] Export local types
- [ ] Export utility functions
- [ ] Export hooks
- [ ] Export query hooks
- [ ] Export form components
- [ ] Export alert dialog components
- [ ] Export table components
- [ ] Export column definitions

---

## API Service (NestJS)

**Location**: `apps/api/src/categories/`

### Phase 15: Setup API File Structure

- [ ] Create directory structure:
  ```
  categories/
  ├── categories.controller.ts
  ├── categories.service.ts
  └── categories.module.ts
  ```

### Phase 16: Define Data Models

- [ ] Define DTOs:
  - `CategoryRowDto`
  - `CategoryDetailDto`
  - `ChildCategoryDto`
  - `RelatedPostDto`

- [ ] Include fields: id, name, slug, parentId, parentName, description, createdAt, updatedAt, deletedAt, icon, sortOrder, _count, postCount, children, posts

### Phase 17: Create Service (`categories.service.ts`)

- [ ] Implement `list(params)`:
  - Build where clause with search and filters
  - Apply pagination
  - Handle soft-delete filtering
  - Calculate post counts (parallel execution)

- [ ] Implement `getOptions(column, search, limit)`:
  - Fetch distinct values for dropdown filters
  - Apply search and limit

- [ ] Implement `getById(id)`:
  - Fetch single category with relations
  - Include children and posts
  - Return CategoryDetailDto

- [ ] Implement `create(data)`:
  - Validate data
  - Create category record
  - Log activity
  - Return created category

- [ ] Implement `update(id, data)`:
  - Validate data
  - Update category record
  - Log activity
  - Return updated category

- [ ] Implement `softDelete(id)`:
  - Set deletedAt timestamp
  - Log activity

- [ ] Implement `restore(id)`:
  - Clear deletedAt timestamp
  - Log activity

- [ ] Implement `hardDelete(id)`:
  - Permanently delete record
  - Log activity

- [ ] Implement `bulk(action, ids, parentId)`:
  - Handle delete, restore, hard-delete, set-parent actions
  - Validate parent changes (prevent cycles)
  - Use native queries for performance
  - Return affected count

- [ ] Implement `collectCategoryDescendantIds(rootId)`:
  - BFS traversal with safety limits (50 levels, 10,000 nodes)
  - Return all descendant IDs
  - Used for filtering and validation

- [ ] Implement `countPostsByCategoryTree(categoryId)`:
  - Count posts in category and all descendants
  - Used for display in list and detail views

### Phase 18: Create Controller (`categories.controller.ts`)

- [ ] Set up controller with `@Controller('admin/categories')`
- [ ] Add authentication guard (check `X-User-Id` header)

- [ ] Implement endpoints:
  - `GET /` - List categories
  - `GET /options` - Get dropdown options
  - `GET /:id` - Get single category
  - `POST /` - Create category
  - `PUT /:id` - Update category
  - `POST /bulk` - Bulk operations
  - `DELETE /:id` - Soft delete
  - `DELETE /:id/hard-delete` - Hard delete
  - `POST /:id/restore` - Restore

- [ ] Add request validation with DTOs
- [ ] Add error handling
- [ ] Add logging

### Phase 19: Create Module (`categories.module.ts`)

- [ ] Import CategoryService and CategoryController
- [ ] Register in providers and controllers
- [ ] Import required modules (Prisma, Notifications, etc.)

### Phase 20: Performance Optimizations

- [ ] Add database indexes on frequently queried fields
- [ ] Use pagination with high limit (1000) for tree views
- [ ] Implement parallel post count calculation
- [ ] Use native bulk operations
- [ ] Optimize tree traversal with safety limits

### Phase 21: Error Handling & Logging

- [ ] Add try-catch blocks in all service methods
- [ ] Log errors with stack traces
- [ ] Return appropriate HTTP status codes:
  - 401 for missing auth
  - 400 for validation errors
  - 404 for not found
  - 500 for server errors
- [ ] Log all API calls in controller
- [ ] Log activity via NotificationsService
- [ ] Maintain audit trail for CRUD operations

---

## Testing Checklist

### Backend Admin UI

- [ ] Test list page loads correctly
- [ ] Test search functionality
- [ ] Test column filters
- [ ] Test tree view display
- [ ] Test pagination
- [ ] Test row selection
- [ ] Test bulk actions
- [ ] Test create new category
- [ ] Test edit category
- [ ] Test delete (soft delete)
- [ ] Test restore from trash
- [ ] Test hard delete from trash
- [ ] Test parent-child relationships
- [ ] Test permission checks
- [ ] Test toast notifications

### API Service

- [ ] Test GET /admin/categories
- [ ] Test GET /admin/categories/options
- [ ] Test GET /admin/categories/:id
- [ ] Test POST /admin/categories
- [ ] Test PUT /admin/categories/:id
- [ ] Test POST /admin/categories/bulk
- [ ] Test DELETE /admin/categories/:id
- [ ] Test DELETE /admin/categories/:id/hard-delete
- [ ] Test POST /admin/categories/:id/restore
- [ ] Test authentication (missing X-User-Id)
- [ ] Test validation errors
- [ ] Test not found errors
- [ ] Test parent cycle prevention
- [ ] Test bulk operations

---

## Clean Code Guidelines

### File Organization
- Keep related files in subdirectories (`_hooks`, `_query`, `_table`, `_form`, `_alert-dialog`)
- Use barrel exports (`index.ts`) for clean imports
- Separate concerns: types, utils, hooks, components

### Code Style
- Use TypeScript strict mode
- Use functional components with hooks
- Use react-hook-form for form management
- Use React Query for data fetching
- Use zod for validation
- Use Lucide icons for consistency
- Use UI components from `@ui/components`

### Performance
- Use React.memo for expensive components
- Use useMemo for computed values
- Use useCallback for event handlers
- Implement proper caching keys
- Use pagination for large datasets

### Error Handling
- Always handle loading and error states
- Show user-friendly error messages
- Log errors for debugging
- Use toast notifications for user feedback

### Permissions
- Use AdminPageGuard for route protection
- Check permissions before showing actions
- Show read-only warnings when appropriate
