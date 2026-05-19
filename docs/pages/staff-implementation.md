# Staff Implementation - Task List

> This document provides a detailed task list for implementing the Staff module. Follow these steps in order to ensure clean, consistent code.

---

## Backend Admin UI (Next.js)

**Location**: `apps/backend/src/app/staff/`

### Phase 1: Setup File Structure

- [x] Create directory structure:
  ```
  staff/
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
      │   └── use-staff-form.ts
      ├── _query/
      │   ├── index.ts
      │   └── use-staff-queries.ts
      ├── _table/
      │   ├── index.ts
      │   ├── staff-table.tsx
      │   └── staff-trash-table.tsx
      ├── _form/
      │   ├── index.ts
      │   └── staff-form-shell.tsx
      └── _alert-dialog/
          ├── index.ts
          └── staff-confirm-dialog.tsx
  ```

### Phase 2: Define Types (`_component/types.ts`)

- [x] Export shared types from `@workspace/api-client`:
  - `User` (from shared package)

- [x] Define local UI types:
  ```typescript
  export type StaffRow = User;

  export interface StaffConfirmAction {
    kind: "delete" | "restore" | "purge";
    row: User;
  }
  ```

### Phase 3: Create Utility Functions (`_component/utils.ts`)

- [x] Implement `buildUsersFilterQuery(filters)`: Convert column filters to API query
  - Map filter id to API query params (fullName → name, email → email, isActive → isActive)
  - Return query object for API request

### Phase 4: Create Form Hook (`_component/_hooks/use-staff-form.ts`)

- [x] Define schema with zod:
  ```typescript
  export const staffFormSchema = z.object({
    email: z.string().email("Email không hợp lệ"),
    fullName: z.string().min(1, "Họ tên không được để trống"),
    password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"),
    isActive: z.boolean(),
    roleCodes: z.array(z.string()),
  });
  ```

- [x] Export `useStaffForm(options)` hook:
  - Manage form state (email, fullName, password, isActive, roleCodes)
  - Provide `resetForm()` to clear form
  - Provide `populateForm(user)` to populate from existing user
  - Provide `toggleRole(code, checked)` to add/remove roles
  - Provide `getPayload()` to prepare data for API submission
  - Support both create and edit modes via `editingId` option

### Phase 5: Create Query Hooks (`_component/_query/use-staff-queries.ts`)

- [x] Implement `useStaffMutations()`:
  - `createMutation`: Create new staff user
  - `updateMutation`: Update existing staff user
  - `deleteMutation`: Soft delete staff user
  - `restoreMutation`: Restore deleted staff user
  - `purgeMutation`: Hard delete staff user
  - `bulkMutation`: Bulk operations (delete, restore, hard-delete)
  - Use React Query mutations with proper cache invalidation
  - Show toast notifications on success/error

### Phase 6: Create Table Columns (`_component/columns.tsx`)

- [x] Define `StaffColumnsProps` interface with `onEdit`, `onDelete`, `busy`, `currentUserId` callbacks
- [x] Implement `getStaffColumns(props)`:
  - Column: Full name (with UserCircle icon)
  - Column: Email (with Mail icon, monospace font)
  - Column: Phone (with Phone icon)
  - Column: Roles (with ShieldHalf icon, badges for each role)
  - Column: Active status (with CheckCircle2/Lock icons)
  - Column: Actions (Edit, Delete buttons)
- [x] Use Lucide icons for action buttons
- [x] Use Badge for status indicators
- [x] Add meta properties for filtering
- [x] Implement `getTrashColumns(props)`:
  - Column: Email
  - Column: Full name
  - Column: Deleted at (with CalendarClock icon)
  - Column: Actions (Restore, Purge buttons)

### Phase 7: Create Table Components (`_component/_table/`)

- [x] Create `staff-table.tsx`:
  - Wrap `AdminDataTable` component
  - Configure data, columns, pagination
  - Add filters, row selection, bulk actions
  - Add clear filter button
  - Support role filtering via props
  - Pass OnChangeFn types for proper TanStack Table compatibility

- [x] Create `staff-trash-table.tsx`:
  - Similar to staff-table but for trash
  - Show restore and purge actions
  - Add refresh button
  - Pass OnChangeFn types for proper TanStack Table compatibility

- [x] Export both from `index.ts`

### Phase 8: Create Form Shell (`_component/_form/staff-form-shell.tsx`)

- [x] Define `StaffFormShellProps` interface:
  ```typescript
  export interface StaffFormShellProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    isEdit: boolean;
    formEmail: string;
    formFullName: string;
    formPassword: string;
    formActive: boolean;
    formRoles: string[];
    roles: Array<{ code: string; name: string }>;
    onEmailChange: (value: string) => void;
    onFullNameChange: (value: string) => void;
    onPasswordChange: (value: string) => void;
    onActiveChange: (checked: boolean) => void;
    onRoleToggle: (code: string, checked: boolean) => void;
    onSubmit: () => Promise<void> | void;
    onCancel: () => void;
    submitting: boolean;
  }
  ```

- [x] Implement form layout with Dialog components
- [x] Include fields:
  - Email (disabled in edit mode)
  - Full name
  - Password (required in create mode, optional in edit mode)
  - Active status (with Switch)
  - Roles (with Checkbox checklist)
- [x] Add role checklist with scrollable container
- [x] Add navigation buttons (Cancel, Save)
- [x] Use ADMIN_DIALOG_CONTENT_MD_CLASS and ADMIN_DIALOG_CONTENT_LG_CLASS

### Phase 9: Create Confirm Dialog (`_component/_alert-dialog/staff-confirm-dialog.tsx`)

- [x] Define props interface with `action`, `target`, `onConfirm`, `loading`
- [x] Use `AdminConfirmActionDialog` shared component
- [x] Handle delete, restore, purge actions
- [x] Show appropriate title, description, icon based on action type:
  - Delete: Archive icon, "Đưa tài khoản vào thùng rác?"
  - Purge: Trash2 icon, "Xóa vĩnh viễn tài khoản?"
  - Restore: ArchiveRestore icon, "Khôi phục tài khoản?"

### Phase 10: Create Main Page (`page.tsx`)

- [x] Import all necessary components and hooks
- [x] Set up state:
  - Main tab (list/trash)
  - Global filter (search with debouncing)
  - Role filter (all/none/specific role)
  - Column filters
  - Row selection
  - Confirm action targets (deleteTarget, restoreTarget, purgeTarget)
  - Pagination state

- [x] Use query hooks:
  - `useStaffUserList` for list
  - `useTrashedStaffUsers` for trash
  - `useRbacCatalog` for roles

- [x] Use mutations for bulk operations:
  - Bulk delete
  - Bulk restore
  - Bulk purge

- [x] Implement role filtering:
  - Filter displayed users by role code
  - Client-side filtering on current page data
  - "all" shows all users
  - "none" shows users with no roles

- [x] Render page with:
  - Page header with title and description
  - Tabs (List, Trash with badge count)
  - Refresh and "Thêm nhân sự" buttons
  - StaffTable or StaffTrashTable based on tab
  - StaffConfirmDialog for delete/restore/purge actions

- [x] Add permission checks with `AdminPageGuard` and `canUserAccess`
- [x] Navigate to `/admin/staff/new` for create
- [x] Navigate to `/admin/staff/[id]/edit` for edit

### Phase 11: Create New Page (`new/page.tsx`)

- [x] Use `StaffFormShell` component
- [x] Use `useStaffForm` hook
- [x] Fetch roles with `useRbacCatalog`
- [x] Implement create mutation with `useStaffMutations`
- [x] Validate form data before submission
- [x] On success: invalidate cache, show toast, navigate to list
- [x] On error: show error toast
- [x] Add permission guard with `AdminPageGuard`
- [x] Use ADMIN_PAGE_FORM_COLUMN_CLASS for layout
- [x] Use ADMIN_PAGE_TITLE_FORM_CLASS for title

### Phase 12: Create Edit Page (`[id]/edit/page.tsx`)

- [x] Fetch user detail with `useStaffUserList` (filter by id)
- [x] Populate form with existing data using `populateForm`
- [x] Use `StaffFormShell` component with `isEdit={true}`
- [x] Implement update mutation
- [x] Handle loading and error states
- [x] Password field is optional in edit mode (leave empty to keep existing)
- [x] Add permission guard
- [x] Navigate to detail page on success

### Phase 13: Create Detail Page (`[id]/page.tsx`)

- [x] Fetch user detail with `useStaffUserList` (filter by id)
- [x] Display information in 2-column layout:
  - Left (col-span-2): Basic info (email, full name, phone), Roles
  - Right (col-span-1): Status, Time info (created at, updated at, deleted at)
- [x] Add navigation buttons (Edit)
- [x] Handle loading and error states
- [x] Show "Không tìm thấy nhân sự" if user not found
- [x] Use Badge for status and roles
- [x] Use formatDateTime from @workspace/api-client
- [x] Add permission guard

### Phase 14: Update Exports (`_component/index.ts`)

- [x] Export local types (StaffRow, StaffConfirmAction)
- [x] Export utility functions (buildUsersFilterQuery)
- [x] Export column definitions (getStaffColumns, getTrashColumns)
- [x] Export hooks (useStaffForm, staffFormSchema)
- [x] Export query hooks (useStaffMutations)
- [x] Export form components (StaffFormShell)
- [x] Export alert dialog components (StaffConfirmDialog)
- [x] Export table components (StaffTable, StaffTrashTable)

---

## API Service (NestJS)

**Location**: `apps/api/src/users/`

> Note: The Staff module uses the existing Users API service. The following endpoints are used:

### Endpoints Used

- `GET /admin/users` - List staff users with pagination, search, filters
- `GET /admin/users/trash` - List trashed staff users
- `POST /admin/users` - Create new staff user
- `PUT /admin/users/:id` - Update staff user
- `DELETE /admin/users/:id` - Soft delete staff user
- `POST /admin/users/:id/restore` - Restore deleted staff user
- `DELETE /admin/users/:id/hard-delete` - Hard delete staff user
- `POST /admin/users/bulk` - Bulk operations (delete, restore, hard-delete)
- `GET /admin/rbac/catalog` - Get roles catalog for role dropdown

### Data Models

- `User` - Staff user entity with:
  - id, email, fullName, phone
  - isActive (boolean)
  - roles (array of Role objects with code and name)
  - createdAt, updatedAt, deletedAt timestamps

---

## Testing Checklist

### Backend Admin UI

- [x] Test list page loads correctly
- [x] Test search functionality (debounced)
- [x] Test column filters
- [x] Test role filtering (client-side)
- [x] Test pagination
- [x] Test row selection
- [x] Test bulk delete
- [x] Test bulk restore
- [x] Test bulk purge
- [x] Test create new staff user
- [x] Test edit staff user
- [x] Test delete (soft delete)
- [x] Test restore from trash
- [x] Test hard delete from trash
- [x] Test role assignment
- [x] Test password validation
- [x] Test permission checks
- [x] Test toast notifications
- [x] Test navigation to detail page
- [x] Test navigation to edit page
- [x] Test typecheck passes

### API Service

- [ ] Test GET /admin/users with pagination
- [ ] Test GET /admin/users with search
- [ ] Test GET /admin/users/trash
- [ ] Test POST /admin/users with valid data
- [ ] Test POST /admin/users with invalid email
- [ ] Test POST /admin/users with short password
- [ ] Test PUT /admin/users/:id
- [ ] Test PUT /admin/users/:id with password change
- [ ] Test POST /admin/users/bulk (delete)
- [ ] Test POST /admin/users/bulk (restore)
- [ ] Test POST /admin/users/bulk (hard-delete)
- [ ] Test DELETE /admin/users/:id
- [ ] Test DELETE /admin/users/:id/hard-delete
- [ ] Test POST /admin/users/:id/restore
- [ ] Test authentication (missing X-User-Id)
- [ ] Test validation errors
- [ ] Test not found errors
- [ ] Test role assignment in create/update

---

## Clean Code Guidelines

### File Organization
- Keep related files in subdirectories (`_hooks`, `_query`, `_table`, `_form`, `_alert-dialog`)
- Use barrel exports (`index.ts`) for clean imports
- Separate concerns: types, utils, hooks, components

### Code Style
- Use TypeScript strict mode
- Use functional components with hooks
- Use custom form hook (not react-hook-form) for state management
- Use React Query for data fetching and mutations
- Use zod for validation schemas
- Use Lucide icons for consistency
- Use UI components from `@ui/components`
- Use OnChangeFn type for TanStack Table change handlers

### Performance
- Use React.memo for expensive components
- Use useMemo for computed values (filtered users, query params)
- Use useCallback for event handlers
- Implement proper caching keys
- Use pagination for large datasets
- Use debounced search (250ms)
- Use client-side role filtering for current page

### Error Handling
- Always handle loading and error states
- Show user-friendly error messages
- Log errors for debugging
- Use toast notifications for user feedback
- Validate form data before API calls

### Permissions
- Use AdminPageGuard for route protection
- Check permissions before showing actions
- Show read-only warnings when appropriate
- Prevent self-deletion (users cannot delete themselves)
- Use canUserAccess for permission checks

### Navigation
- Navigate to separate pages for create/edit/detail instead of inline dialogs
- Use window.location.href for navigation
- Maintain proper route structure (/admin/staff/new, /admin/staff/[id], /admin/staff/[id]/edit)
