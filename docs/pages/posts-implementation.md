# Posts Implementation - Task List

> This document provides a detailed task list for implementing the Posts module. Follow these steps in order to ensure clean, consistent code.

---

## Backend Admin UI (Next.js)

**Location**: `apps/backend/src/app/posts/`

### Phase 1: Setup File Structure

- [ ] Create directory structure:
  ```
  posts/
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
      ├── summary-badges.tsx
      ├── columns.tsx
      ├── _hooks/
      │   ├── index.ts
      │   ├── use-post-form.ts
      │   ├── use-posts-actions.ts
      │   └── use-posts-filters.ts
      ├── _query/
      │   ├── index.ts
      │   ├── use-posts-queries.ts
      │   ├── use-posts-mutations.ts
      │   └── use-taxonomy-queries.ts
      ├── _table/
      │   ├── index.ts
      │   ├── posts-table.tsx
      │   └── posts-trash-table.tsx
      ├── _form/
      │   ├── index.ts
      │   └── post-form-shell.tsx
      └── _alert-dialog/
          ├── index.ts
          └── posts-confirm-dialog.tsx
  ```

### Phase 2: Define Types (`_component/types.ts`)

- [ ] Export shared types from `@workspace/api-client`:
  - `Post`
  - `CreatePostInput`
  - `UpdatePostInput`

- [ ] Define local UI types:
  ```typescript
  export type TaxonomyOption = {
    id: string;
    name: string;
  };

  export type PostListRow = {
    id: string;
    title: string;
    slug: string;
    excerpt: string | null;
    image: string | null;
    published: boolean;
    publishedAt: string | null;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
    author: {
      id: string;
      name: string | null;
      email: string;
    };
    categories: TaxonomyOption[];
    tags: TaxonomyOption[];
  };

  export type PostConfirmAction =
    | { kind: "delete"; row: PostListRow }
    | { kind: "restore"; row: PostListRow }
    | { kind: "purge"; row: PostListRow };
  ```

### Phase 3: Create Utility Functions (`_component/utils.ts`)

- [ ] Implement `slugify(text)`: Convert text to URL-friendly slug
- [ ] Implement `getSeoStatus(title, slug, excerpt)`: Calculate SEO status
- [ ] Implement `buildCategoryOptionTree(rows)`: Build hierarchical category tree
- [ ] Implement `buildPostsFilterQuery(filters)`: Convert column filters to API query
- [ ] Implement `formatDateTime(date)`: Format date/time for display
- [ ] Implement `normalizeContentForEditor(content)`: Prepare content for editor

### Phase 4: Create Form Hook (`_component/_hooks/use-post-form.ts`)

- [ ] Define schema with zod:
  ```typescript
  export const postFormSchema = z.object({
    title: z.string().min(1, "Tiêu đề không được để trống"),
    slug: z.string(),
    excerpt: z.string(),
    image: z.string(),
    content: z.record(z.any()),
    published: z.boolean(),
    publishedAt: z.string(),
    categoryIds: z.array(z.string()),
    tagIds: z.array(z.string()),
  });
  ```

- [ ] Define default values: Empty editor state with one paragraph
- [ ] Export `usePostForm()` hook using `useForm` with zodResolver
- [ ] Export `buildPostPayload()` helper

### Phase 5: Create Query Hooks (`_component/_query/use-posts-queries.ts`)

- [ ] Implement `usePostsQuery(params)`:
  - Fetch posts with pagination, search, filters
  - Use `useQuery` from React Query
  - Cache key: `["admin", "posts"]`

- [ ] Implement `useTrashQuery(params)`:
  - Fetch trashed posts
  - Cache key: `["admin", "posts", "trash"]`

- [ ] Implement `usePostDetailQuery(api, id)`:
  - Fetch single post by ID
  - Cache key: `["admin", "posts", id]`

- [ ] Implement `useCategoriesQuery()`:
  - Fetch categories for dropdown
  - Cache key: `["admin", "categories"]`

- [ ] Implement `useTagsQuery()`:
  - Fetch tags for dropdown
  - Cache key: `["admin", "tags"]`

### Phase 6: Create Mutation Hooks (`_component/_query/use-posts-mutations.ts`)

- [ ] Implement `useDeleteMutation()`:
  - Soft delete with cache invalidation
  - Show toast on success/error

- [ ] Implement `useRestoreMutation()`:
  - Restore from trash
  - Invalidate cache

- [ ] Implement `usePurgeMutation()`:
  - Hard delete from trash
  - Invalidate cache

- [ ] Implement `useBulkMutation()`:
  - Bulk operations (delete, restore, hard-delete)
  - Handle multiple IDs

### Phase 7: Create Table Columns (`_component/columns.tsx`)

- [ ] Define `PostColumnsProps` interface with `onView`, `onEdit`, `onDelete` callbacks
- [ ] Implement `getPostColumns(props)`:
  - Column: Title (with slug displayed below in smaller text)
  - Column: Slug
  - Column: Author
  - Column: Categories (using SummaryBadges component)
  - Column: Tags (using SummaryBadges component)
  - Column: Published status (Badge)
  - Column: Updated at (formatted date)
  - Column: Actions (View, Edit, Delete/Restore)
- [ ] Use Lucide icons for action buttons (Eye, Pencil, Trash2, ArchiveRestore)
- [ ] Use Badge for status indicators
- [ ] Add meta properties for filtering:
  - Categories: `filterVariant: "tree-multi-select"` with `treeOptions`
  - Tags: `filterVariant: "select"` with `selectOptions`
  - Published: `filterVariant: "multi-select"` with published/draft options
  - Updated at: `filterVariant: "date-range"`
- [ ] Implement `getTrashColumns(props)`:
  - Similar to main columns but adds deletedAt column
  - Actions: Restore and Purge buttons

### Phase 8: Create Table Components (`_component/_table/`)

- [ ] Create `posts-table.tsx`:
  - Wrap `AdminDataTable` component
  - Configure data, columns, pagination
  - Add filters, row selection, bulk actions
  - Add refresh and clear filter buttons

- [ ] Create `posts-trash-table.tsx`:
  - Similar to posts-table but for trash
  - Show restore and purge actions

- [ ] Export both from `index.ts`

### Phase 9: Create Form Shell (`_component/_form/post-form-shell.tsx`)

- [ ] Define `PostFormShellProps` interface:
  ```typescript
  export interface PostFormShellProps {
    form: UseFormReturn<PostFormValues>;
    onSubmit: (values: PostFormValues) => Promise<void>;
    submitting: boolean;
    editingId: string | null;
    onBack: () => void;
    onReset: () => void;
  }
  ```

- [ ] Implement form layout with Card components
- [ ] Use `Controller` from react-hook-form for controlled inputs
- [ ] Include fields: title, slug, excerpt, image, content (editor), published, publishedAt, categories, tags
- [ ] Add character count badges
- [ ] Add validation error messages
- [ ] Add navigation buttons (Back, Reset, Save)

### Phase 10: Create Confirm Dialog (`_component/_alert-dialog/posts-confirm-dialog.tsx`)

- [ ] Define props interface with `confirmAction`, `deleteMutation`, etc.
- [ ] Use `AdminConfirmActionDialog` shared component
- [ ] Handle delete, restore, purge actions
- [ ] Show appropriate title, description, icon based on action type

### Phase 11: Create Main Page (`page.tsx`)

- [ ] Import all necessary components and hooks
- [ ] Set up state:
  - Main tab (list/trash)
  - Pagination (page, pageSize)
  - Global filter (search)
  - Column filters
  - Row selection
  - Confirm action

- [ ] Use query hooks:
  - `usePostsQuery` for list
  - `useTrashQuery` for trash
  - `useCategoriesQuery` for category filters
  - `useTagsQuery` for tag filters

- [ ] Use mutations for delete, restore, purge

- [ ] Render page with:
  - Page header with title and description
  - Tabs (List, Trash)
  - PostsTable or PostsTrashTable based on tab
  - PostsConfirmDialog

- [ ] Add permission checks with `AdminPageGuard`

### Phase 12: Create New Page (`new/page.tsx`)

- [ ] Use `PostFormShell` component
- [ ] Use `usePostForm` hook
- [ ] Implement create mutation with `useMutation`
- [ ] On success: invalidate cache, show toast, navigate to list
- [ ] On error: show error toast
- [ ] Add permission guard

### Phase 13: Create Edit Page (`[id]/edit/page.tsx`)

- [ ] Fetch post detail with `usePostDetailQuery`
- [ ] Populate form with existing data
- [ ] Use `PostFormShell` component
- [ ] Implement update mutation
- [ ] Handle loading and error states
- [ ] Add permission guard

### Phase 14: Create Detail Page (`[id]/page.tsx`)

- [ ] Fetch post detail
- [ ] Display information in 2-column layout
- [ ] Show post content preview
- [ ] Add navigation buttons (Back, Edit)
- [ ] Handle loading and error states
- [ ] Add permission guard

### Phase 15: Update Exports (`_component/index.ts`)

- [ ] Re-export shared types from `@workspace/api-client`
- [ ] Export local types
- [ ] Export utility functions
- [ ] Export hooks
- [ ] Export query hooks
- [ ] Export mutation hooks
- [ ] Export form components
- [ ] Export alert dialog components
- [ ] Export table components
- [ ] Export column definitions

---

## API Service (NestJS)

**Location**: `apps/api/src/posts/`

### Phase 16: Setup API File Structure

- [ ] Create directory structure:
  ```
  posts/
  ├── posts.controller.ts
  ├── posts.service.ts
  └── posts.module.ts
  ```

### Phase 17: Define Data Models

- [ ] Define DTOs:
  - `PostRowDto`
  - `PostDetailDto`
  - `RelatedPostDto`

- [ ] Include fields: id, title, slug, excerpt, image, published, publishedAt, eventStartAt, eventEndAt, createdAt, updatedAt, deletedAt, author, categories, tags

### Phase 18: Create Service (`posts.service.ts`)

- [ ] Implement `list(params)`:
  - Build where clause with search and filters
  - Apply pagination
  - Handle soft-delete filtering
  - Resolve relation filters (categories, tags)

- [ ] Implement `getOptions(column, search, limit)`:
  - Fetch distinct values for dropdown filters
  - Apply search and limit

- [ ] Implement `getDatesWithPosts()`:
  - Get dates that have published posts
  - Return array of date strings

- [ ] Implement `getById(id)`:
  - Fetch single post with relations
  - Include author, categories, tags
  - Return PostDetailDto

- [ ] Implement `create(authorId, data)`:
  - Validate data
  - Validate category and tag IDs
  - Create post record
  - Log activity
  - Return created post

- [ ] Implement `update(id, data)`:
  - Validate data
  - Update post record
  - Log activity
  - Return updated post

- [ ] Implement `softDelete(id)`:
  - Set deletedAt timestamp
  - Log activity

- [ ] Implement `restore(id)`:
  - Clear deletedAt timestamp
  - Log activity

- [ ] Implement `hardDelete(id)`:
  - Permanently delete record
  - Log activity

- [ ] Implement `bulkSetCategories(ids, categoryIds, mode)`:
  - Bulk assign categories to posts
  - Support 'add' or 'replace' mode
  - Use native queries for performance

- [ ] Implement `bulkClearImages(ids)`:
  - Bulk clear image field
  - Use native queries

- [ ] Implement `bulk(action, ids)`:
  - Handle delete, restore, hard-delete actions
  - Use native queries for performance
  - Return affected count

### Phase 19: Create Controller (`posts.controller.ts`)

- [ ] Set up controller with `@Controller('admin/posts')`
- [ ] Add authentication guard (check `X-User-Id` header)

- [ ] Implement endpoints:
  - `GET /` - List posts
  - `GET /options` - Get dropdown options
  - `GET /dates-with-posts` - Get dates with published posts
  - `GET /:id` - Get single post
  - `POST /` - Create post
  - `PUT /:id` - Update post
  - `POST /bulk` - Bulk operations
  - `DELETE /:id` - Soft delete
  - `DELETE /:id/hard-delete` - Hard delete
  - `POST /:id/restore` - Restore

- [ ] Add request validation with DTOs
- [ ] Add error handling
- [ ] Add logging

### Phase 20: Create Module (`posts.module.ts`)

- [ ] Import PostService and PostController
- [ ] Register in providers and controllers
- [ ] Import required modules (Prisma, Notifications, etc.)

### Phase 21: Performance Optimizations

- [ ] Add database indexes on frequently queried fields
- [ ] Use two-step query for complex joins:
  - First query: Get IDs with pagination and ordering
  - Second query: Fetch full data by IDs
- [ ] Use native bulk operations
- [ ] Optimize category tree traversal
- [ ] Use pagination with configurable limits

### Phase 22: Error Handling & Logging

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
- [ ] Test column filters (tree-multi-select for categories, select for tags, multi-select for status, date-range for dates)
- [ ] Test pagination
- [ ] Test row selection
- [ ] Test bulk delete action
- [ ] Test create new post
- [ ] Test edit post
- [ ] Test publish/unpublish
- [ ] Test delete (soft delete)
- [ ] Test restore from trash
- [ ] Test hard delete from trash
- [ ] Test category assignment
- [ ] Test tag assignment
- [ ] Test permission checks
- [ ] Test toast notifications
- [ ] Test SummaryBadges component for categories/tags display

### API Service

- [ ] Test GET /admin/posts
- [ ] Test GET /admin/posts/options
- [ ] Test GET /admin/posts/dates-with-posts
- [ ] Test GET /admin/posts/:id
- [ ] Test POST /admin/posts
- [ ] Test PUT /admin/posts/:id
- [ ] Test POST /admin/posts/bulk
- [ ] Test DELETE /admin/posts/:id
- [ ] Test DELETE /admin/posts/:id/hard-delete
- [ ] Test POST /admin/posts/:id/restore
- [ ] Test authentication (missing X-User-Id)
- [ ] Test validation errors
- [ ] Test not found errors
- [ ] Test bulk operations
- [ ] Test category tree filtering

---

## Common Issues and Solutions

### Issue 1: Rich Text Editor Content Not Saving
**Problem**: Editor content is not properly serialized when saving.
**Solution**:
- Use `normalizeContentForEditor()` helper to prepare content
- Ensure content is structured as expected by the editor
- Handle both old and new content formats for backward compatibility

### Issue 2: Category Tree Performance
**Problem**: Category dropdown becomes slow with many categories.
**Solution**:
- Use pagination with high limit (1000) for category tree
- Implement parallel post count calculation
- Use native bulk operations for better performance

### Issue 3: Taxonomy Badges Not Displaying
**Problem**: Categories and tags don't display as badges.
**Solution**:
- Use SummaryBadges component from `_component/summary-badges.tsx`
- Ensure items array is properly formatted with name property
- Check that the component is correctly imported and used

### Issue 4: Bulk Operations Not Updating UI
**Problem**: After bulk operations, list doesn't reflect changes.
**Solution**:
- Invalidate cache after bulk operations: `queryClient.invalidateQueries({ queryKey: ["admin", "posts"] })`
- Show toast notification on success
- Ensure optimistic updates or proper loading states

### Issue 5: Filter Variants Not Working
**Problem**: Column filters don't show expected filter types.
**Solution**:
- Set correct `filterVariant` in column meta: "tree-multi-select", "select", "multi-select", "date-range"
- Provide proper options: `treeOptions`, `selectOptions`, etc.
- Ensure AdminDataTable supports the filter variant types

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
- Use two-step query for complex joins

### Error Handling
- Always handle loading and error states
- Show user-friendly error messages
- Log errors for debugging
- Use toast notifications for user feedback

### Permissions
- Use AdminPageGuard for route protection
- Check permissions before showing actions
- Show read-only warnings when appropriate
