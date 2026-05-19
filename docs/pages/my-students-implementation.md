# My Students Implementation - Task List

> This document provides a detailed task list for implementing the My Students module. Follow these steps in order to ensure clean, consistent code.

---

## Backend Admin UI (Next.js)

**Location**: `apps/backend/src/app/my-students/`

### Phase 1: Setup File Structure

- [ ] Create directory structure:
  ```
  my-students/
  ├── page.tsx
  └── _component/
      ├── index.ts
      ├── types.ts
      ├── columns.tsx
      ├── _query/
      │   ├── index.ts
      │   └── use-my-students-queries.ts
      └── _alert-dialog/
          ├── index.ts
          └── add-student-dialog.tsx
  ```

### Phase 2: Define Types (`_component/types.ts`)

- [ ] Export shared types from `@workspace/api-client`:
  ```typescript
  export type { ParentStudent, AddStudentInput } from "@workspace/api-client";
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

### Phase 3: Create Query Hooks (`_component/_query/use-my-students-queries.ts`)

- [ ] Import from `@/hooks/queries` for shared hooks:
  - `useMyStudents` - list student connections
- [ ] Implement mutations using `api.myStudents` from `@workspace/api-client`:
  - `addStudentMutation` - add student connection using `api.myStudents.add()`
  - `removeStudentMutation` - remove student connection using `api.myStudents.remove()`
- [ ] Use React Query mutations with proper cache invalidation
- [ ] Show toast notifications on success/error

### Phase 4: Create Table Columns (`_component/columns.tsx`)

- [ ] Define column definitions with proper types
- [ ] Use status badges with appropriate colors based on PARENT_STUDENT_STATUS_COLORS
- [ ] Add action buttons (remove) using Lucide icons (Trash2)
- [ ] Format dates properly

### Phase 5: Implement Main List Page (`page.tsx`)

- [ ] Import query hooks and table columns from `_component`
- [ ] Import `useMyStudents` from `@/hooks/queries` for data fetching
- [ ] Use `AdminDataTable` component
- [ ] Add "Add Student" button using Plus icon
- [ ] Wrap with `AdminPageGuard` for permission check (parent role)
- [ ] Handle student addition via dialog
- [ ] Handle student removal with confirmation

### Phase 6: Implement Add Student Dialog (`_component/_alert-dialog/add-student-dialog.tsx`)

- [ ] Create dialog using Dialog components from `@ui/components`
- [ ] Define props interface with `open`, `onClose`
- [ ] Use React Hook Form with zodResolver for validation:
  ```typescript
  import { useForm } from "react-hook-form";
  import { zodResolver } from "@hookform/resolvers/zod";
  import { z } from "zod";
  import { FormFieldCol } from "@ui/components/typing";
  import { Input, Textarea } from "@ui/components";
  import { FieldError } from "@ui/components/field";

  const schema = z.object({
    studentCode: z.string().min(1, "Mã học sinh không được để trống"),
    notes: z.string().optional(),
  });

  type FormData = z.infer<typeof schema>;

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { studentCode: "", notes: "" },
  });
  ```
- [ ] Add student code input using Input component with Controller:
  ```typescript
  <Controller
    name="studentCode"
    control={form.control}
    render={({ field, fieldState }) => (
      <FormFieldCol label="Mã học sinh" required>
        <Input
          {...field}
          placeholder="Nhập mã học sinh"
          className={fieldState.error ? "border-destructive" : ""}
        />
        {fieldState.error && <FieldError>{fieldState.error.message}</FieldError>}
      </FormFieldCol>
    )}
  />
  ```
- [ ] Add optional notes field using Textarea component with Controller
- [ ] Handle submit with mutation using `api.myStudents.add()`
- [ ] Show loading states with Loader2 icon
- [ ] Use FormFieldCol for form layout consistency
- [ ] Reset form after successful submission

## Clean Code Guidelines

- Use TypeScript interfaces for type safety
- Follow the established naming conventions
- Keep components focused and reusable
- Use React Query for data fetching and caching
- Handle loading and error states appropriately
- Use UI components from `@ui/components`
- Use Lucide icons for consistency

## Testing Checklist

- [ ] List page loads correctly
- [ ] Add student dialog opens and closes correctly
- [ ] Student code validation works
- [ ] Add student request submits successfully
- [ ] Remove student action works with confirmation
- [ ] Status badges display correctly
- [ ] Permission checks prevent unauthorized access
- [ ] Loading states display correctly
- [ ] Error messages display correctly
