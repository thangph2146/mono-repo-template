# Contact Requests Implementation - Task List

> This document provides a detailed task list for implementing the Contact Requests module. Follow these steps in order to ensure clean, consistent code.

---

## Backend Admin UI (Next.js)

**Location**: `apps/backend/src/app/contact-requests/`

### Phase 1: Setup File Structure

- [ ] Create directory structure:
  ```
  contact-requests/
  ├── page.tsx
  └── _component/
      ├── index.ts
      ├── types.ts
      ├── columns.tsx
      ├── _query/
      │   ├── index.ts
      │   └── use-contact-queries.ts
      └── _alert-dialog/
          ├── index.ts
          └── contact-detail-dialog.tsx
  ```

### Phase 2: Define Types (`_component/types.ts`)

- [ ] Export shared types from `@workspace/api-client`:
  ```typescript
  export type { ContactRequest, UpdateContactRequestInput } from "@workspace/api-client";
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

### Phase 3: Create Query Hooks (`_component/_query/use-contact-queries.ts`)

- [ ] Import from `@/hooks/queries` for shared hooks:
  - `useContactRequests` - list with pagination and filters
  - `useContactRequestDetail` - get single contact request
- [ ] Implement mutations using `api.contactRequests` from `@workspace/api-client`:
  - `updateStatusMutation` - update status and notes using `api.contactRequests.update()`
  - `archiveMutation` - archive request using `api.contactRequests.archive()`
  - `deleteMutation` - delete request using `api.contactRequests.remove()`
- [ ] Use React Query mutations with proper cache invalidation
- [ ] Show toast notifications on success/error

### Phase 4: Create Table Columns (`_component/columns.tsx`)

- [ ] Define column definitions with proper types
- [ ] Use status badges with appropriate colors based on CONTACT_REQUEST_STATUS_LABELS
- [ ] Add action buttons (view, archive, delete) using Lucide icons (Eye, Archive, Trash2)
- [ ] Format dates and phone numbers properly

### Phase 5: Implement Main List Page (`page.tsx`)

- [ ] Import query hooks and table columns from `_component`
- [ ] Import `useContactRequests` from `@/hooks/queries` for data fetching
- [ ] Add search input for filtering by name, email, subject
- [ ] Add status filter dropdown using CONTACT_REQUEST_STATUSES
- [ ] Use `AdminDataTable` component
- [ ] Handle pagination with page and pageSize state
- [ ] Wrap with `AdminPageGuard` for permission check (super_admin, admin roles)
- [ ] Use correct route paths (e.g., `/staff` not `/admin/staff`)

### Phase 6: Implement Detail Dialog (`_component/_alert-dialog/contact-detail-dialog.tsx`)

- [ ] Create dialog using Dialog components from `@ui/components`
- [ ] Define props interface with `contact`, `open`, `onClose`
- [ ] Use React Hook Form with Controller for controlled components:
  ```typescript
  import { useForm, Controller } from "react-hook-form";
  import { FormFieldCol } from "@ui/components/typing";
  import { Select, Textarea } from "@ui/components";
  import type { ContactRequest } from "./types";

  const form = useForm({
    defaultValues: {
      status: contact?.status ?? "new",
      notes: contact?.notes ?? "",
    },
  });
  ```
- [ ] Add status update dropdown using Select component with Controller:
  ```typescript
  <Controller
    name="status"
    control={form.control}
    render={({ field }) => (
      <FormFieldCol label="Trạng thái">
        <Select onValueChange={field.onChange} value={field.value}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="new">Mới</SelectItem>
            <SelectItem value="in-progress">Đang xử lý</SelectItem>
            <SelectItem value="resolved">Đã giải quyết</SelectItem>
          </SelectContent>
        </Select>
      </FormFieldCol>
    )}
  />
  ```
- [ ] Add notes textarea using Textarea component with Controller
- [ ] Handle submit with mutation using `api.contactRequests.update()`
- [ ] Show loading states with Loader2 icon
- [ ] Use FormFieldCol for form layout consistency
- [ ] Use FieldError from `@ui/components/field` for error display

## Clean Code Guidelines

- Use TypeScript interfaces for type safety
- Follow the established naming conventions
- Keep components focused and reusable
- Use React Query for data fetching and caching
- Handle loading and error states appropriately
- Use UI components from `@ui/components`
- Use Lucide icons for consistency

## Testing Checklist

- [ ] List page loads correctly with pagination
- [ ] Search filters work as expected
- [ ] Status filter works correctly
- [ ] Detail dialog opens and displays correct information
- [ ] Status updates save successfully
- [ ] Notes save successfully
- [ ] Archive action works
- [ ] Delete action works with confirmation
- [ ] Permission checks prevent unauthorized access
- [ ] Loading states display correctly
- [ ] Error messages display correctly
