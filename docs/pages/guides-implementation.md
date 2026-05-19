# Guides Implementation - Task List

> This document provides a detailed task list for implementing the Guides module. Follow these steps in order to ensure clean, consistent code.

---

## Backend Admin UI (Next.js)

**Location**: `apps/backend/src/app/guides/`

### Phase 1: Setup File Structure

- [ ] Create directory structure:
  ```
  guides/
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
      │   └── use-guide-form.ts
      ├── _query/
      │   ├── index.ts
      │   └── use-guides-queries.ts
      ├── _table/
      │   ├── index.ts
      │   └── guides-table.tsx
      ├── _form/
      │   ├── index.ts
      │   ├── guide-form-shell.tsx
      │   ├── step-editor.tsx
      │   └── image-upload-field.tsx
      └── _alert-dialog/
          ├── index.ts
          └── guides-confirm-dialog.tsx
  ```

### Phase 2: Define Types (`_component/types.ts`)

- [ ] Export shared types from `@workspace/api-client`:
  - `PageContent` → `GuideGroup`
  - `PageContentStep` → `GuideStep`
  - `CreatePageContentInput` → `CreateGuideInput`
  - `UpdatePageContentInput` → `UpdateGuideInput`

- [ ] Define local UI types:
  ```typescript
  export interface GuideFormData {
    sectionKey: string;
    isVisible: boolean;
    content: {
      title?: string | null;
      description?: string | null;
      order?: number;
      steps?: GuideStep[];
    };
  }

  export interface GuideConfirmAction {
    kind: "delete";
    row: GuideGroup;
  }
  ```

### Phase 3: Create Utility Functions (`_component/utils.ts`)

- [ ] Implement `parseContent(content)`: Parse JSON content from API
- [ ] Implement `apiBase()`: Get API base URL
- [ ] Implement `authHeaders()`: Create auth headers with X-User-Id
- [ ] Implement `uploadImage(file)`: Upload image to `/admin/uploads`
- [ ] Implement `sortGroupsByOrder(groups)`: Sort groups by content.order
- [ ] Implement `reorderSteps(steps)`: Reorder steps after drag-drop
- [ ] Implement `formatDateTime(date)`: Format date/time for display

### Phase 4: Create Form Hook (`_component/_hooks/use-guide-form.ts`)

- [ ] Define schema with zod:
  ```typescript
  export const guideFormSchema = z.object({
    sectionKey: z.string().min(1, "Section key không được để trống"),
    content: z.object({
      title: z.string(),
      description: z.string(),
      order: z.coerce.number(),
      steps: z.array(z.object({
        order: z.coerce.number(),
        title: z.string(),
        description: z.string(),
        imageUrl: z.string(),
      })),
    }),
    isVisible: z.boolean(),
  });
  ```

- [ ] Define default values: Empty form state
- [ ] Export `useGuideForm()` hook using `useForm` with zodResolver
- [ ] Export `buildGuidePayload()` helper

### Phase 5: Create Query Hooks (`_component/_query/use-guides-queries.ts`)

- [ ] Implement `useGuidesQuery(api, params)`:
  - Fetch guides with pagination, search
  - Use `useQuery` from React Query
  - Cache key: `["admin", "guides"]`

- [ ] Implement `useGuideDetailQuery(api, id)`:
  - Fetch single guide by ID
  - Cache key: `["admin", "guides", id]`

- [ ] Implement `useCreateGuideMutation(api)`:
  - Create guide with SDK
  - Invalidate cache on success

- [ ] Implement `useUpdateGuideMutation(api)`:
  - Update guide with SDK
  - Invalidate cache on success

- [ ] Implement `useDeleteGuideMutation(api)`:
  - Delete guide with SDK
  - Invalidate cache on success

- [ ] Implement `useReorderGuidesMutation(api)`:
  - Reorder guides with SDK
  - Invalidate cache on success

### Phase 6: Create Table Columns (`_component/columns.tsx`)

- [ ] Define `GuidesColumnsProps` interface with `onView`, `onEdit`, `onDelete` callbacks
- [ ] Implement `getGuidesColumns(props)`:
  - Column: Section Key
  - Column: Title
  - Column: Steps count
  - Column: Visible status
  - Column: Actions (View, Edit, Delete)
- [ ] Use Lucide icons for action buttons
- [ ] Use Badge for status indicators

### Phase 7: Create Table Components (`_component/_table/`)

- [ ] Create `guides-table.tsx`:
  - Wrap `AdminDataTable` component
  - Configure data, columns, pagination
  - Add filters, row selection, bulk actions

- [ ] Export from `index.ts`

### Phase 8: Create Form Shell (`_component/_form/guide-form-shell.tsx`)

- [ ] Define `GuideFormShellProps` interface:
  ```typescript
  export interface GuideFormShellProps {
    form: UseFormReturn<GuideFormValues>;
    onSubmit: (values: GuideFormValues) => Promise<void>;
    submitting: boolean;
    editingId: string | null;
    onBack: () => void;
    onReset: () => void;
  }
  ```

- [ ] Implement form layout with 2-column structure:
  - **Left column (col-span-2)**: Steps editor (StepEditor)
  - **Right column (col-span-1)**: Basic info, visibility settings, overview

- [ ] Use `Controller` from react-hook-form for controlled inputs
- [ ] Include fields: sectionKey, content.title, content.description, content.steps, isVisible
- [ ] Add character count badges
- [ ] Add validation error messages
- [ ] Add navigation buttons (Back, Reset, Save)

### Phase 9: Create Step Editor (`_component/_form/step-editor.tsx`)

- [ ] Define props interface with steps array and onChange callback
- [ ] Implement step list with drag-drop reordering
- [ ] Add step creation button
- [ ] Add step deletion button
- [ ] Add image upload field for each step
- [ ] Use ImageUploadField component for images

### Phase 10: Create Image Upload Field (`_component/_form/image-upload-field.tsx`)

- [ ] Define props interface with value and onChange
- [ ] Implement file upload to `/admin/uploads`
- [ ] Show image preview
- [ ] Add remove image button
- [ ] Handle upload progress

### Phase 11: Create Confirm Dialog (`_component/_alert-dialog/guides-confirm-dialog.tsx`)

- [ ] Define props interface with `confirmAction`, `deleteMutation`, etc.
- [ ] Use `AdminConfirmActionDialog` shared component
- [ ] Handle delete action
- [ ] Show appropriate title, description, icon based on action type

### Phase 12: Create Main Page (`page.tsx`)

- [ ] Import all necessary components and hooks
- [ ] Set up state:
  - Pagination (page, limit)
  - Global filter (search)
  - Confirm action

- [ ] Use query hooks:
  - `useGuidesQuery` for list

- [ ] Use mutations for delete

- [ ] Render page with:
  - Page header with title and description
  - GuidesTable
  - GuidesConfirmDialog

- [ ] Add permission checks with `AdminPageGuard`

### Phase 13: Create New Page (`new/page.tsx`)

- [ ] Use `GuideFormShell` component
- [ ] Use `useGuideForm` hook
- [ ] Implement create mutation with `useCreateGuideMutation`
- [ ] On success: invalidate cache, show toast, navigate to list
- [ ] On error: show error toast
- [ ] Add permission guard

### Phase 14: Create Edit Page (`[id]/edit/page.tsx`)

- [ ] Fetch guide detail with `useGuideDetailQuery`
- [ ] Populate form with existing data
- [ ] Use `GuideFormShell` component
- [ ] Implement update mutation with `useUpdateGuideMutation`
- [ ] Handle loading and error states
- [ ] Add permission guard

### Phase 15: Create Detail Page (`[id]/page.tsx`)

- [ ] Fetch guide detail with `useGuideDetailQuery`
- [ ] Display information in 2-column layout:
  - **Left column (col-span-2)**: Steps with images
  - **Right column (col-span-1)**: Guide info, time info, status
- [ ] Add navigation buttons (Back, Edit)
- [ ] Handle loading and error states
- [ ] Add permission guard

### Phase 16: Update Exports (`_component/index.ts`)

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

## API Service (@workspace/api-client)

**Location**: `packages/api-client/src/resources/guides.ts`

### Phase 17: Setup SDK Integration

- [ ] Ensure `StoreSyncSdk` has `guides` property
- [ ] Implement `GuidesApi` class with methods:
  - `list(params)` - List guides with pagination
  - `get(id)` - Get single guide by ID
  - `create(body)` - Create new guide
  - `update(id, body)` - Update guide
  - `remove(id)` - Soft delete guide
  - `restore(id)` - Restore trashed guide
  - `purge(id)` - Hard delete guide
  - `bulk(body)` - Bulk operations

### Phase 18: Define Data Models

- [ ] Define DTOs:
  - `GuideRowDto`
  - `GuideDetailDto`
  - `GuideStepDto`

- [ ] Include fields: id, pageKey, sectionKey, isVisible, content (title, description, order, steps), deletedAt, createdAt, updatedAt

### Phase 19: SDK Usage Pattern

```typescript
import { createStoreSyncSdk } from "@workspace/api-client";

const api = createStoreSyncSdk({ baseUrl: "http://localhost:3002/api" });

// List guides
const { items, total } = await api.guides.list<GuideGroup>({
  page: 1,
  limit: 50,
  search: "huong-dan-su-dung",
});

// Get guide by id
const guide = await api.guides.get<GuideGroup>(id);

// Create guide
await api.guides.create({
  pageKey: "huong-dan-su-dung",
  sectionKey: "dang-nhap",
  isVisible: true,
  content: { title: "Hướng dẫn đăng nhập", steps: [...] },
});

// Update guide
await api.guides.update(id, { isVisible: false, content: { ... } });

// Delete guide
await api.guides.remove(id);
```

---

## Testing Checklist

### Backend Admin UI

- [ ] Test list page loads correctly
- [ ] Test search functionality
- [ ] Test create new guide
- [ ] Test edit guide
- [ ] Test delete guide
- [ ] Test step editor (add, remove, reorder)
- [ ] Test image upload for steps
- [ ] Test 2-column form layout
- [ ] Test detail page layout
- [ ] Test permission checks
- [ ] Test toast notifications

### API Service

- [ ] Test list guides
- [ ] Test get guide by ID
- [ ] Test create guide
- [ ] Test update guide
- [ Test delete guide
- [ ] Test authentication (missing X-User-Id)
- [ ] Test validation errors
- [ ] Test not found errors

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

### SDK Pattern
- Pass `api` parameter to all query and mutation hooks
- Use `StoreSyncSdk` from `@workspace/api-client`
- Re-export shared types from `@workspace/api-client`
- Use aliases for clarity (`GuideGroup` for `PageContent`)

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

### Layout Guidelines
- **Form Shell**: 2-column layout with steps on left (col-span-2), other info on right (col-span-1)
- **Detail Page**: 2-column layout with steps on left (col-span-2), other info on right (col-span-1)
- Use Card components for grouping related information
- Use Badge for status indicators
