# Tags Implementation - Task List

> This document provides a detailed task list for implementing the Tags module. Follow these steps in order to ensure clean, consistent code.

---

## Backend Admin UI (Next.js)

**Location**: `apps/backend/src/app/tags/`

### Phase 1: Setup File Structure

- [ ] Create directory structure:
  ```
  tags/
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
      │   ├── use-tag-form.ts
      │   ├── use-tags-actions.ts
      │   └── use-tags-filters.ts
      ├── _query/
      │   ├── index.ts
      │   └── use-tags-queries.ts
      ├── _table/
      │   ├── index.ts
      │   ├── tags-table.tsx
      │   └── tags-trash-table.tsx
      ├── _form/
      │   ├── index.ts
      │   └── tag-form-shell.tsx
      └── _alert-dialog/
          ├── index.ts
          └── tags-confirm-dialog.tsx
  ```

### Phase 2: Define Types (`_component/types.ts`)

- [ ] Export shared types from `@workspace/api-client`:
  - `Tag`
  - `CreateTagInput`
  - `UpdateTagInput`

- [ ] Define local UI types:
  ```typescript
  export type TagRow = {
    id: string;
    name: string;
    slug: string;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
  };

  export type TagTreeRow = TagRow & {
    isGroup?: boolean;
    itemCount?: number;
    subRows?: TagTreeRow[];
  };

  export interface TagConfirmAction {
    kind: "delete" | "restore" | "purge";
    row: TagRow;
  }

  export interface RelatedPost {
    id: string;
    title: string;
    slug: string;
    published: boolean;
    publishedAt: string | null;
    createdAt: string;
  }

  export interface TagDetail extends TagRow {
    postCount: number;
    posts: RelatedPost[];
  }
  ```

### Phase 3: Create Utility Functions (`_component/utils.ts`)

- [ ] Implement `slugify(text)`: Convert text to URL-friendly slug
- [ ] Implement `humanizeSlug(slug)`: Convert slug back to readable text
- [ ] Implement `sortTagsByName(rows)`: Sort tags by name (Vietnamese locale)
- [ ] Implement `buildTagTree(rows)`: Build hierarchical tree based on name prefixes
- [ ] Implement `buildTagsFilterQuery(filters)`: Convert column filters to API query
- [ ] Implement `toFilterQuery(key, value)`: Helper for filter queries
- [ ] Implement `buildTagPayload(values)`: Prepare form data for API submission

### Phase 4: Create Form Hook (`_component/_hooks/use-tag-form.ts`)

- [ ] Define schema with zod:
  ```typescript
  export const tagFormSchema = z.object({
    name: z.string().min(1, "Tên tag không được để trống"),
    slug: z.string(),
  });
  ```

- [ ] Define default values: Empty form state
- [ ] Export `useTagForm()` hook using `useForm` with zodResolver
- [ ] Export `buildTagPayload()` helper

### Phase 5: Create Query Hooks (`_component/_query/use-tags-queries.ts`)

- [ ] Implement `useTagsListQuery()`:
  - Fetch all tags (no pagination for list view)
  - Use `useQuery` from React Query
  - Cache key: `["admin", "tags", "list"]`

- [ ] Implement `useTrashQuery(params)`:
  - Fetch trashed tags with pagination
  - Cache key: `["admin", "tags", "trash"]`

- [ ] Implement `useTagDetailQuery(api, id)`:
  - Fetch single tag by ID with posts
  - Cache key: `["admin", "tags", id]`

### Phase 6: Create Table Columns (`_component/columns.tsx`)

- [ ] Define `TagColumnsProps` interface with `onEdit`, `onDelete` callbacks
- [ ] Implement `getTagsColumns(props)`:
  - Column: Name (with tree indentation)
  - Column: Slug
  - Column: Post count
  - Column: Actions (View, Edit, Delete/Restore)
- [ ] Use Lucide icons for action buttons
- [ ] Use Badge for status indicators
- [ ] Add meta properties for filtering

### Phase 7: Create Table Components (`_component/_table/`)

- [ ] Create `tags-table.tsx`:
  - Wrap `AdminDataTable` component
  - Configure data, columns, pagination (disabled for list view)
  - Add filters, row selection, bulk actions
  - Add refresh and clear filter buttons

- [ ] Create `tags-trash-table.tsx`:
  - Similar to tags-table but for trash
  - Show restore and purge actions
  - Enable pagination

- [ ] Export both from `index.ts`

### Phase 8: Create Form Shell (`_component/_form/tag-form-shell.tsx`)

- [ ] Define `TagFormShellProps` interface:
  ```typescript
  export interface TagFormShellProps {
    form: UseFormReturn<TagFormValues>;
    onSubmit: (values: TagFormValues) => Promise<void>;
    submitting: boolean;
    editingId: string | null;
    onBack: () => void;
    onReset: () => void;
  }
  ```

- [ ] Implement form layout with Card components
- [ ] Use `Controller` from react-hook-form for controlled inputs
- [ ] Include fields: name, slug
- [ ] Add character count badges
- [ ] Add validation error messages
- [ ] Add navigation buttons (Back, Reset, Save)

### Phase 9: Create Confirm Dialog (`_component/_alert-dialog/tags-confirm-dialog.tsx`)

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
  - `useTagsListQuery` for list (all tags)
  - `useTrashQuery` for trash (paginated)

- [ ] Use mutations for delete, restore, purge

- [ ] Implement `buildTagTree()`:
  - Group tags by prefix (tags with same prefix become parent groups)
  - Example: "react", "react-hooks" → "react" becomes parent of "react-hooks"
  - Sort by name
  - Mark group items with `isGroup: true`
  - Filter out group items from bulk operations

- [ ] Render page with:
  - Page header with title and description
  - Tabs (List, Trash)
  - TagsTable or TagsTrashTable based on tab
  - TagsConfirmDialog

- [ ] Add permission checks with `AdminPageGuard`

### Phase 11: Create New Page (`new/page.tsx`)

- [ ] Use `TagFormShell` component
- [ ] Use `useTagForm` hook
- [ ] Implement create mutation with `useMutation`
- [ ] On success: invalidate cache, show toast, navigate to list
- [ ] On error: show error toast
- [ ] Add permission guard

### Phase 12: Create Edit Page (`[id]/edit/page.tsx`)

- [ ] Fetch tag detail with `useTagDetailQuery`
- [ ] Populate form with existing data
- [ ] Use `TagFormShell` component
- [ ] Implement update mutation
- [ ] Handle loading and error states
- [ ] Add permission guard

### Phase 13: Create Detail Page (`[id]/page.tsx`)

- [ ] Fetch tag detail with posts
- [ ] Display information in 2-column layout:
  - Left (col-span-2): Tag info, related posts
  - Right (col-span-1): Time info, post count
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

**Location**: `apps/api/src/tags/`

### Phase 15: Setup API File Structure

- [ ] Create directory structure:
  ```
  tags/
  ├── tags.controller.ts
  ├── tags.service.ts
  └── tags.module.ts
  ```

### Phase 16: Define Data Models

- [ ] Define DTOs:
  - `TagRowDto`
  - `TagDetailDto`
  - `RelatedPostDto`

- [ ] Include fields: id, name, slug, createdAt, updatedAt, deletedAt, postCount, posts

### Phase 17: Create Service (`tags.service.ts`)

- [ ] Implement `list(params)`:
  - Build where clause with search and filters
  - Apply pagination
  - Handle soft-delete filtering
  - Support date range filtering on `deletedAt` and `updatedAt`

- [ ] Implement `getOptions(column, search, limit)`:
  - Fetch distinct values for dropdown filters
  - Apply search and limit

- [ ] Implement `getById(id)`:
  - Fetch single tag with relations
  - Include posts (ordered by createdAt DESC)
  - Limit to 10 related posts
  - Return TagDetailDto with postCount

- [ ] Implement `create(data)`:
  - Validate data
  - Create tag record
  - Log activity
  - Return created tag

- [ ] Implement `update(id, data)`:
  - Validate data
  - Update tag record
  - Log activity
  - Return updated tag

- [ ] Implement `softDelete(id)`:
  - Set deletedAt timestamp
  - Log activity

- [ ] Implement `restore(id)`:
  - Clear deletedAt timestamp
  - Log activity

- [ ] Implement `hardDelete(id)`:
  - Permanently delete record
  - Log activity

- [ ] Implement `bulk(action, ids)`:
  - Handle delete, restore, hard-delete actions
  - Use native queries for performance
  - Return affected count

### Phase 18: Create Controller (`tags.controller.ts`)

- [ ] Set up controller with `@Controller('admin/tags')`
- [ ] Add authentication guard (check `X-User-Id` header)

- [ ] Implement endpoints:
  - `GET /` - List tags
  - `GET /options` - Get dropdown options
  - `GET /:id` - Get single tag
  - `POST /` - Create tag
  - `PUT /:id` - Update tag
  - `POST /bulk` - Bulk operations
  - `DELETE /:id` - Soft delete
  - `DELETE /:id/hard-delete` - Hard delete
  - `POST /:id/restore` - Restore

- [ ] Add request validation with DTOs
- [ ] Add error handling
- [ ] Add logging

### Phase 19: Create Module (`tags.module.ts`)

- [ ] Import TagService and TagController
- [ ] Register in providers and controllers
- [ ] Import required modules (Prisma, Notifications, etc.)

### Phase 20: Performance Optimizations

- [ ] Add database indexes on frequently queried fields
- [ ] Use pagination with configurable limits
- [ ] Use native bulk operations
- [ ] Index-based ordering
- [ ] Efficient date range queries
- [ ] Limited related posts in detail view (10 max)

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

- [ ] Test list page loads correctly (all tags)
- [ ] Test search functionality
- [ ] Test column filters
- [ ] Test tree view display (prefix-based grouping)
- [ ] Test pagination for trash view
- [ ] Test row selection
- [ ] Test bulk actions (exclude group items)
- [ ] Test create new tag
- [ ] Test edit tag
- [ ] Test delete (soft delete)
- [ ] Test restore from trash
- [ ] Test hard delete from trash
- [ ] Test permission checks
- [ ] Test toast notifications

### API Service

- [ ] Test GET /admin/tags
- [ ] Test GET /admin/tags/options
- [ ] Test GET /admin/tags/:id
- [ ] Test POST /admin/tags
- [ ] Test PUT /admin/tags/:id
- [ ] Test POST /admin/tags/bulk
- [ ] Test DELETE /admin/tags/:id
- [ ] Test DELETE /admin/tags/:id/hard-delete
- [ ] Test POST /admin/tags/:id/restore
- [ ] Test authentication (missing X-User-Id)
- [ ] Test validation errors
- [ ] Test not found errors
- [ ] Test bulk operations
- [ ] Test date range filtering

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
- Use native bulk operations

### Error Handling
- Always handle loading and error states
- Show user-friendly error messages
- Log errors for debugging
- Use toast notifications for user feedback

### Permissions
- Use AdminPageGuard for route protection
- Check permissions before showing actions
- Show read-only warnings when appropriate

### Client-Side Tree Logic
- Tags are flat in database (no parent relationship)
- Tree is built client-side based on naming conventions
- Tags with common prefixes are grouped
- Example: "react" becomes parent of "react-hooks", "react-redux"
- Group items marked with `isGroup: true`
- Bulk operations filter out group items
- This is purely for UI organization
