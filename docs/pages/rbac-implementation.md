# RBAC Implementation - Task List

> This document provides a detailed task list for implementing the RBAC module. Follow these steps in order to ensure clean, consistent code.

---

## Backend Admin UI (Next.js)

**Location**: `apps/backend/src/app/rbac/`

### Phase 1: Setup File Structure

- [ ] Create directory structure:
  ```
  rbac/
  ├── page.tsx
  └── _component/
      ├── index.ts
      ├── types.ts
      ├── columns.tsx
      └── _query/
          ├── index.ts
          └── use-rbac-queries.ts
  ```

### Phase 2: Define Types (`_component/types.ts`)

- [ ] Export shared types from `@workspace/api-client`:
  ```typescript
  export type { Role, Permission, CreateRoleInput, UpdateRoleInput } from "@workspace/api-client";
  ```

- [ ] Define local constants:
  ```typescript
  export const PERMISSION_GROUPS = [
    "users",
    "posts",
    "categories",
    "tags",
    "guides",
    "media",
    "settings",
  ];
  ```

### Phase 3: Create Query Hooks (`_component/_query/use-rbac-queries.ts`)

- [ ] Import from `@/hooks/queries` for shared hooks:
  - `useRbacCatalog` - for fetching roles and permissions
- [ ] Implement mutations using `api.rbac` from `@workspace/api-client`:
  - `createRoleMutation` - create new role using `api.rbac.createRole()`
  - `updateRoleMutation` - update role using `api.rbac.updateRole()`
  - `deleteRoleMutation` - delete role using `api.rbac.deleteRole()`
- [ ] Use React Query mutations with proper cache invalidation
- [ ] Show toast notifications on success/error

### Phase 4: Create Table Columns (`_component/columns.tsx`)

- [ ] Define column definitions with proper types
- [ ] Display role code, display name, description
- [ ] Show permission count as Badge component
- [ ] Show system role indicator using Badge variant
- [ ] Add action buttons (edit, delete) only for non-system roles using Lucide icons (Pencil, Trash2)
- [ ] Use `isSuperAdminRoleCode` from `@workspace/api-client` to protect super admin role
- [ ] Use Lock icon for super admin role

### Phase 5: Implement Main RBAC Page (`page.tsx`)

- [ ] Import query hooks and table columns from `_component`
- [ ] Import `useRbacCatalog` from `@/hooks/queries` for data fetching
- [ ] Implement tabs using Tabs component:
  - Roles tab with table and bulk actions
  - Permissions tab with grouped permission list
- [ ] Add search input for filtering roles using Input component
- [ ] Add refresh button using RefreshCw icon
- [ ] Add "Add Role" button (super admin only) using Plus icon
- [ ] Use `AdminDataTable` component
- [ ] Handle pagination with page and pageSize state
- [ ] Implement bulk delete action
- [ ] Wrap with `AdminPageGuard` for permission check (super_admin only)
- [ ] Use correct route paths
- [ ] Display permissions grouped by category with Vietnamese labels
- [ ] Use ScrollArea for permission list
- [ ] Use Checkbox for permission display

### Phase 6: Implement Role Dialog (`_component/_alert-dialog/role-dialog.tsx`)

- [ ] Create dialog using Dialog components from `@ui/components`
- [ ] Define props interface with `open`, `onClose`, `role` (for edit mode), `permissions`
- [ ] Use React Hook Form with zodResolver for validation:
  ```typescript
  import { useForm, Controller } from "react-hook-form";
  import { zodResolver } from "@hookform/resolvers/zod";
  import { z } from "zod";
  import { FormFieldCol } from "@ui/components/typing";
  import { Input, Textarea, Checkbox } from "@ui/components";
  import { FieldError } from "@ui/components/field";

  const schema = z.object({
    code: z.string().min(1, "Mã vai trò không được để trống").regex(/^[a-z_]+$/, "Chỉ chứa chữ thường và gạch dưới"),
    name: z.string().min(1, "Tên nội bộ không được để trống"),
    displayName: z.string().min(1, "Tên hiển thị không được để trống"),
    description: z.string().optional(),
    permissionCodes: z.array(z.string()).min(1, "Phải chọn ít nhất 1 quyền"),
  });

  type FormData = z.infer<typeof schema>;

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      code: "",
      name: "",
      displayName: "",
      description: "",
      permissionCodes: [],
    },
  });
  ```
- [ ] Add role code input using Input with Controller and FormFieldCol (disabled in edit mode)
- [ ] Add name and displayName inputs using Controller and FormFieldCol
- [ ] Add description textarea using Controller and FormFieldCol
- [ ] Add permission checkboxes using Controller with Checkbox:
  ```typescript
  <Controller
    name="permissionCodes"
    control={form.control}
    render={({ field: { value, onChange }, fieldState }) => (
      <FormFieldCol label="Quyền hạn" required>
        <div className="max-h-[300px] space-y-2 overflow-y-auto rounded-lg border border-border p-3">
          {permissions.map((perm) => (
            <div key={perm.code} className="flex items-center gap-3">
              <Checkbox
                checked={value.includes(perm.code)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    onChange([...value, perm.code]);
                  } else {
                    onChange(value.filter((c) => c !== perm.code));
                  }
                }}
              />
              <span className="text-sm">{perm.code}</span>
            </div>
          ))}
        </div>
        {fieldState.error && <FieldError>{fieldState.error.message}</FieldError>}
      </FormFieldCol>
    )}
  />
  ```
- [ ] Handle submit with mutation using `api.rbac.createRole()` or `api.rbac.updateRole()`
- [ ] Show loading states with Loader2 icon
- [ ] Use FormFieldCol for form layout consistency
- [ ] Populate form when editing existing role

## Testing Checklist

- [ ] Roles list page loads correctly
- [ ] Search filter works correctly
- [ ] Create role dialog opens and closes correctly
- [ ] Role code validation works (lowercase, underscores only)
- [ ] Role creation saves successfully
- [ ] Role edit loads existing data
- [ ] Role update saves successfully
- [ ] Permission selection works correctly
- [ ] Delete role works with confirmation
- [ ] System roles cannot be edited or deleted
- [ ] Super admin role cannot be edited or deleted
- [ ] Permissions tab displays correctly
- [ ] Permission grouping works correctly
- [ ] Permission checks prevent unauthorized access
- [ ] Loading states display correctly
- [ ] Error messages display correctly

## Common Issues and Solutions

### Issue 1: Super Admin Role Deletion
**Problem**: Super admin role is deleted, breaking system.
**Solution**:
- Use `isSuperAdminRoleCode()` from `@workspace/api-client` to check
- Disable delete button for super admin role
- Show Lock icon for super admin role
- Add tooltip explaining why deletion is disabled

### Issue 2: Permission Selection Not Saving
**Problem**: Selected permissions are not saved when creating/updating role.
**Solution**:
- Ensure `permissionCodes` array is included in the payload
- Verify the API accepts permission codes in the expected format
- Check that permission codes match the catalog from RBAC service
- Show toast notification on success/error

### Issue 3: Role Code Validation Not Working
**Problem**: Role code doesn't validate lowercase and underscores only.
**Solution**:
- Use regex validation in zod schema: `.regex(/^[a-z_]+$/, "Chỉ chứa chữ thường và gạch dưới")`
- Disable role code input in edit mode to prevent changes
- Show FieldError for validation errors

---

## Clean Code Guidelines

- Use TypeScript interfaces for type safety
- Follow the established naming conventions
- Keep components focused and reusable
- Use React Query for data fetching and caching
- Handle loading and error states appropriately
- Use UI components from `@ui/components`
- Use Lucide icons for consistency
- Protect system roles from modification
- Group permissions logically

## Testing Checklist

- [ ] Roles list page loads correctly
- [ ] Search filter works correctly
- [ ] Create role dialog opens and closes correctly
- [ ] Role code validation works (lowercase, underscores only)
- [ ] Role creation saves successfully
- [ ] Role edit loads existing data
- [ ] Role update saves successfully
- [ ] Permission selection works correctly
- [ ] Delete role works with confirmation
- [ ] System roles cannot be edited or deleted
- [ ] Super admin role cannot be edited or deleted
- [ ] Permissions tab displays correctly
- [ ] Permission grouping works correctly
- [ ] Permission checks prevent unauthorized access
- [ ] Loading states display correctly
- [ ] Error messages display correctly
