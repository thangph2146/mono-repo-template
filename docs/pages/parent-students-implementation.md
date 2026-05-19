# Parent Students Implementation - Task List

> This document provides a detailed task list for implementing the Parent Students module. Follow these steps in order to ensure clean, consistent code.

---

## Backend Admin UI (Next.js)

**Location**: `apps/backend/src/app/parent-students/`

### Phase 1: Setup File Structure

- [ ] Create directory structure:
  ```
  parent-students/
  ├── page.tsx
  └── _component/
      ├── index.ts
      ├── types.ts
      ├── columns.tsx
      └── _query/
          ├── index.ts
          └── use-parent-students-queries.ts
  ```

### Phase 2: Define Types (`_component/types.ts`)

- [ ] Export shared types from `@workspace/api-client`:
  ```typescript
  export type { ParentStudent, UpdateParentStudentInput } from "@workspace/api-client";
  ```

- [ ] Define local constants:
  ```typescript
  export const PARENT_STUDENT_STATUSES: ParentStudent["status"][] = [
    "pending",
    "approved",
    "rejected",
  ];

  export const PARENT_STUDENT_STATUS_LABELS: Record<ParentStudent["status"], string> = {
    pending: "Chờ duyệt",
    approved: "Đã duyệt",
    rejected: "Đã từ chối",
  };

  export const PARENT_STUDENT_STATUS_COLORS: Record<ParentStudent["status"], string> = {
    pending: "bg-yellow-100 text-yellow-800",
    approved: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
  };
  ```

### Phase 3: Create Query Hooks (`_component/_query/use-parent-students-queries.ts`)

- [ ] Import from `@/hooks/queries` for shared hooks:
  - `useParentStudents` - list with pagination and filters
- [ ] Implement mutations using `api.parentStudents` from `@workspace/api-client`:
  - `approveMutation` - approve request using `api.parentStudents.approve()`
  - `rejectMutation` - reject request using `api.parentStudents.reject()`
  - `deleteMutation` - delete request using `api.parentStudents.remove()`
- [ ] Use React Query mutations with proper cache invalidation
- [ ] Show toast notifications on success/error

### Phase 4: Create Table Columns (`_component/columns.tsx`)

- [ ] Define column definitions with proper types
- [ ] Use status badges with appropriate colors based on PARENT_STUDENT_STATUS_COLORS
- [ ] Add action buttons (approve, reject) only for pending status using Lucide icons (CheckCircle2, XCircle)
- [ ] Format dates properly
- [ ] Display parent and student information

### Phase 5: Implement Main List Page (`page.tsx`)

- [ ] Import query hooks and table columns from `_component`
- [ ] Import `useParentStudents` from `@/hooks/queries` for data fetching
- [ ] Add status filter dropdown using PARENT_STUDENT_STATUSES
- [ ] Add refresh button using RefreshCw icon
- [ ] Use `AdminDataTable` component with row selection
- [ ] Handle pagination with page and pageSize state
- [ ] Implement bulk approve/reject actions using mutations from `api.parentStudents`
- [ ] Wrap with `AdminPageGuard` for permission check (super_admin, admin roles)
- [ ] Use correct route paths

### Phase 6: Implement Detail/Action Dialog (optional)

- [ ] Create dialog using Dialog components from `@ui/components`
- [ ] Use React Hook Form with Controller for controlled components:
  ```typescript
  import { useForm, Controller } from "react-hook-form";
  import { FormFieldCol } from "@ui/components/typing";
  import { Select, Textarea } from "@ui/components";
  import { FieldError } from "@ui/components/field";

  const form = useForm({
    defaultValues: {
      status: request?.status ?? "pending",
      notes: request?.notes ?? "",
    },
  });
  ```
- [ ] Add status dropdown using Select with Controller and FormFieldCol
- [ ] Add notes textarea using Textarea with Controller and FormFieldCol
- [ ] Handle submit with mutation using `api.parentStudents.approve()` or `api.parentStudents.reject()`
- [ ] Show loading states with Loader2 icon
- [ ] Use FormFieldCol for form layout consistency

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
- [ ] Status filter works correctly
- [ ] Approve action works with confirmation
- [ ] Reject action works with confirmation
- [ ] Bulk approve works correctly
- [ ] Bulk reject works correctly
- [ ] Status badges display correctly
- [ ] Permission checks prevent unauthorized access
- [ ] Loading states display correctly
- [ ] Error messages display correctly
