# Contact Requests Implementation - Task List

> This document provides a detailed task list for implementing the Contact Requests module. Follow these steps in order to ensure clean, consistent code.

---

## Backend Admin UI (Next.js)

**Location**: `apps/backend/src/app/contact-requests/`

### Phase 1: Setup File Structure

- [ ] Create directory structure following standard pattern:
  ```
  contact-requests/
  ├── page.tsx                    # Main list page (active items)
  ├── new/
  │   └── page.tsx                # Create page
  ├── [id]/
  │   ├── page.tsx                # Detail page
  │   └── edit/
  │       └── page.tsx            # Edit page
  └── _component/
      ├── index.ts                # Export all components
      ├── types.ts                # TypeScript types
      ├── utils.ts                # Utility functions
      ├── columns.tsx             # Table column definitions
      ├── _hooks/                 # Custom React hooks
      │   ├── index.ts
      │   └── use-contact-form.ts
      ├── _query/                 # React Query hooks
      │   ├── index.ts
      │   └── use-contact-queries.ts
      ├── _table/                 # Table components
      │   ├── index.ts
      │   └── contact-table.tsx
      ├── _form/                  # Form shell components
      │   ├── index.ts
      │   └── contact-form-shell.tsx
      └── _alert-dialog/          # Confirmation dialogs
          ├── index.ts
          └── contact-confirm-dialog.tsx
  ```

### Phase 2: Define Types (`_component/types.ts`)

- [ ] Export shared types from `@workspace/api-client`:
  ```typescript
  export type {
    ContactRequest,
    CreateContactRequestInput,
    UpdateContactRequestInput
  } from "@workspace/api-client";
  ```

- [ ] Define local constants:
  ```typescript
  export const CONTACT_REQUEST_STATUSES: ContactRequest["status"][] = [
    "new",
    "in-progress",
    "resolved",
    "archived",
  ];

  export const CONTACT_REQUEST_STATUS_LABELS: Record<ContactRequest["status"], string> = {
    new: "Mới",
    "in-progress": "Đang xử lý",
    resolved: "Đã giải quyết",
    archived: "Đã lưu trữ",
  };
  ```

### Phase 3: Create Utility Functions (`_component/utils.ts`)

- [ ] Implement utility functions for data transformation:
  ```typescript
  export function formatPhoneNumber(phone: string): string {
    // Format phone number for display
  }

  export function buildFilterQuery(search?: string, status?: string): Record<string, any> {
    // Build filter query object for API calls
  }
  ```

### Phase 4: Create Form Hook (`_component/_hooks/use-contact-form.ts`)

- [ ] Define schema with zod:
  ```typescript
  export const contactFormSchema = z.object({
    name: z.string().min(1, "Tên không được để trống"),
    email: z.string().email("Email không hợp lệ"),
    phone: z.string().min(1, "Số điện thoại không được để trống"),
    subject: z.string().min(1, "Tiêu đề không được để trống"),
    message: z.string().min(1, "Nội dung không được để trống"),
  });
  ```
- [ ] Export `useContactForm(options)` hook using react-hook-form:
  - Use `useForm` with zodResolver
  - Provide `form` object (UseFormReturn)
  - Provide `resetForm()`, `populateForm()`, `getPayload()`
  - Support both create and edit modes

### Phase 5: Create Query Hooks (`_component/_query/use-contact-queries.ts`)

- [ ] Import from `@/hooks/queries` for shared hooks:
  - `useContactRequests` - list with pagination and filters
  - `useContactRequestDetail` - get single contact request
- [ ] Implement mutations using `api.contactRequests` from `@workspace/api-client`:
  - `createMutation` - create request using `api.contactRequests.create()`
  - `updateMutation` - update request using `api.contactRequests.update()`
  - `deleteMutation` - soft delete using `api.contactRequests.remove()`
  - `restoreMutation` - restore using `api.contactRequests.restore()`
  - `purgeMutation` - permanent delete using `api.contactRequests.purge()`
- [ ] Use React Query mutations with proper cache invalidation
- [ ] Show toast notifications on success/error

### Phase 6: Create Table Columns (`_component/columns.tsx`)

- [ ] Define column definitions with proper types
- [ ] Use status badges with appropriate colors based on CONTACT_REQUEST_STATUS_LABELS
- [ ] Add action buttons (view, edit, delete, restore, purge) using Lucide icons (Eye, Pencil, Trash2, RotateCcw, AlertTriangle)
- [ ] Format dates and phone numbers properly
- [ ] Add meta properties for filtering

### Phase 7: Create Table Components (`_component/_table/contact-table.tsx`)

- [ ] Create wrapper component around `AdminDataTable`
- [ ] Configure data, columns, pagination
- [ ] Add filters (search, status)
- [ ] Add tabs for Active/Trash items
- [ ] Handle row selection and bulk actions
- [ ] Handle module-specific table logic

### Phase 8: Create Form Shell (`_component/_form/contact-form-shell.tsx`)

- [ ] Define props interface with form state and callbacks
- [ ] Implement form layout with Dialog components
- [ ] Use FormFieldCol/FormFieldRow for form layout consistency
- [ ] Handle form submission with mutations
- [ ] Support both create and edit modes

### Phase 9: Create Confirm Dialog (`_component/_alert-dialog/contact-confirm-dialog.tsx`)

- [ ] Define props interface with action type, target, callbacks
- [ ] Use `AdminConfirmActionDialog` shared component
- [ ] Handle delete, restore, purge actions with appropriate icons and messages

### Phase 10: Implement Main List Page (`page.tsx`)

- [ ] Import query hooks and table components from `_component`
- [ ] Import shared hooks from `@/hooks/queries`
- [ ] Use table component from `_component/_table/contact-table.tsx`
- [ ] Add filters (search, status)
- [ ] Add tabs for Active/Trash items using state
- [ ] Wrap with `AdminPageGuard` for permission check (super_admin, admin roles)
- [ ] Use correct route paths (e.g., `/contact-requests` not `/admin/contact-requests`)
- [ ] Add "Add New" button linking to `/contact-requests/new`
- [ ] Handle pagination with page and pageSize state

### Phase 11: Implement Create Page (`new/page.tsx`)

- [ ] Import form hook and form shell from `_component`
- [ ] Use `contact-form-shell` component for create mode
- [ ] Set form mode to "create"
- [ ] Handle form submission with createMutation
- [ ] Redirect to list page on success
- [ ] Wrap with `AdminPageGuard` for permission check
- [ ] Add breadcrumb navigation

### Phase 12: Implement Detail Page (`[id]/page.tsx`)

- [ ] Import `useContactRequestDetail` from `@/hooks/queries`
- [ ] Fetch contact request data by ID
- [ ] Display all contact request information (name, email, phone, subject, message, status, notes, created_at)
- [ ] Add status update form using form shell (read-only for basic fields, editable for status and notes)
- [ ] Add "Edit" button linking to `/contact-requests/[id]/edit`
- [ ] Add "Delete" button with confirmation dialog
- [ ] Handle loading and error states
- [ ] Wrap with `AdminPageGuard` for permission check
- [ ] Add breadcrumb navigation

### Phase 13: Implement Edit Page (`[id]/edit/page.tsx`)

- [ ] Import `useContactRequestDetail` from `@/hooks/queries`
- [ ] Fetch contact request data by ID
- [ ] Import form hook and form shell from `_component`
- [ ] Use `contact-form-shell` component for edit mode
- [ ] Populate form with existing data
- [ ] Set form mode to "edit"
- [ ] Handle form submission with updateMutation
- [ ] Redirect to detail page on success
- [ ] Wrap with `AdminPageGuard` for permission check
- [ ] Add breadcrumb navigation

## Clean Code Guidelines

- Use TypeScript interfaces for type safety
- Follow the established naming conventions
- Keep components focused and reusable
- Use React Query for data fetching and caching
- Handle loading and error states appropriately
- Use UI components from `@ui/components`
- Use Lucide icons for consistency

## Testing Checklist

### List Page
- [ ] List page loads correctly with pagination
- [ ] Active/Trash tabs switch correctly
- [ ] Search filters work as expected (name, email, subject)
- [ ] Status filter works correctly
- [ ] "Add New" button navigates to create page
- [ ] Delete action soft deletes item (moves to trash)
- [ ] Restore action restores item from trash
- [ ] Purge action permanently deletes item from trash
- [ ] Bulk actions work correctly

### Create Page
- [ ] Create page loads correctly
- [ ] Form validation works for all required fields
- [ ] Submit creates new contact request
- [ ] Success toast displays
- [ ] Redirects to list page on success
- [ ] Breadcrumb navigation works

### Detail Page
- [ ] Detail page loads correctly with ID
- [ ] All information displays correctly
- [ ] Status update works
- [ ] Notes update works
- [ ] "Edit" button navigates to edit page
- [ ] "Delete" button shows confirmation dialog
- [ ] Breadcrumb navigation works

### Edit Page
- [ ] Edit page loads correctly with ID
- [ ] Form populates with existing data
- [ ] Form validation works
- [ ] Submit updates contact request
- [ ] Success toast displays
- [ ] Redirects to detail page on success
- [ ] Breadcrumb navigation works

### General
- [ ] Permission checks prevent unauthorized access
- [ ] Loading states display correctly
- [ ] Error messages display correctly
- [ ] Route paths are correct (no /admin prefix)
