# Pages Implementation Documentation

> This directory contains detailed task lists for implementing admin pages in the backend application. Each document provides step-by-step instructions for AI coding to ensure clean, consistent code.

## Available Implementation Guides

### Core Modules

- **[Categories Implementation](./categories-implementation.md)** - Task list for implementing the Categories module with hierarchical tree structure, parent-child relationships, and bulk operations.

- **[Posts Implementation](./posts-implementation.md)** - Task list for implementing the Posts module with rich text editor, taxonomy (categories/tags), and publishing workflow.

- **[Tags Implementation](./tags-implementation.md)** - Task list for implementing the Tags module with client-side prefix-based tree grouping and flat data model.

- **[Guides Implementation](./guides-implementation.md)** - Task list for implementing the Guides module with step-by-step instructions, image uploads, and SDK-based API integration.

- **[Staff Implementation](./staff-implementation.md)** - Task list for implementing the Staff module with user management, role assignment, and soft-delete functionality.

### Additional Modules

- **[Contact Requests Implementation](./contact-requests-implementation.md)** - Task list for implementing the Contact Requests module with message management, status tracking, and response workflow.

- **[Data Management Implementation](./data-implementation.md)** - Task list for implementing the Data Management module with database export, backup, and restore functionality.

- **[My Students Implementation](./my-students-implementation.md)** - Task list for implementing the My Students module for parent-student relationship management.

- **[Parent Students Implementation](./parent-students-implementation.md)** - Task list for implementing the Parent Students module for managing parent-student connection requests.

- **[Profile Implementation](./profile-implementation.md)** - Task list for implementing the Profile module for user profile management.

- **[RBAC Implementation](./rbac-implementation.md)** - Task list for implementing the RBAC module for managing roles and permissions.

## How to Use

1. **Before implementing**: Read the relevant implementation guide for the module you're working on.
2. **Follow the phases**: Each guide is divided into phases (Phase 1, Phase 2, etc.) that should be completed in order.
3. **Check off tasks**: Each phase has a checklist of tasks. Complete them one by one.
4. **Test thoroughly**: After implementation, use the Testing Checklist at the end of each guide to verify functionality.
5. **Follow clean code guidelines**: Refer to the Clean Code Guidelines section for best practices.

## Standard Implementation Pattern

### File Structure Template

All new admin pages should follow this structure:

```
module-name/
├── page.tsx                    # Main list page
├── new/
│   └── page.tsx                # Create page (optional, for complex forms)
├── [id]/
│   ├── page.tsx                # Detail page (optional)
│   └── edit/
│       └── page.tsx            # Edit page (optional, for complex forms)
└── _component/
    ├── index.ts                # Export all components
    ├── types.ts                # TypeScript types (export from @workspace/api-client)
    ├── utils.ts                # Utility functions (optional)
    ├── columns.tsx             # Table column definitions
    ├── _hooks/                 # Custom React hooks (optional)
    │   ├── index.ts
    │   └── use-module-form.ts # Form hook with zodResolver
    ├── _query/                 # React Query hooks
    │   ├── index.ts
    │   └── use-module-queries.ts
    ├── _table/                 # Table components (optional)
    │   ├── index.ts
    │   └── module-table.tsx
    ├── _form/                  # Form components (optional)
    │   ├── index.ts
    │   └── module-form-shell.tsx
    └── _alert-dialog/          # Dialog components (optional)
        ├── index.ts
        └── module-dialog.tsx
```

### Step-by-Step Implementation

#### Phase 1: Setup File Structure
- Create directory structure following the template above
- Create index.ts files in each subdirectory for clean exports

#### Phase 2: Define Types (`_component/types.ts`)
- Export shared types from `@workspace/api-client`:
  ```typescript
  export type { ModuleType, CreateModuleInput, UpdateModuleInput } from "@workspace/api-client";
  ```
- Define local UI types if needed (for table rows, form state, etc.)
- Define constants (status labels, colors, etc.)

#### Phase 3: Create Query Hooks (`_component/_query/use-module-queries.ts`)
- Import from `@/hooks/queries` for shared hooks when available
- Implement mutations using `api.moduleName` from `@workspace/api-client`:
  ```typescript
  import { useMutation, useQueryClient } from "@tanstack/react-query";
  import { api } from "@/lib/api";
  import { toast } from "sonner";

  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (input: CreateModuleInput) => {
      return api.moduleName.create(input);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["module-name"] });
      toast.success("Đã tạo");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
  ```

#### Phase 4: Create Table Columns (`_component/columns.tsx`)
- Define column definitions with proper types
- Use Badge for status indicators
- Add action buttons using Lucide icons
- Add meta properties for filtering

#### Phase 5: Implement Main List Page (`page.tsx`)
- Import query hooks and table columns from `_component`
- Import shared hooks from `@/hooks/queries`
- Use `AdminDataTable` component
- Add filters, search, pagination
- Wrap with `AdminPageGuard` for permission check
- Use correct route paths (e.g., `/staff` not `/admin/staff`)

#### Phase 6: Implement Form (if needed)
- Use React Hook Form with zodResolver:
  ```typescript
  import { useForm, Controller } from "react-hook-form";
  import { zodResolver } from "@hookform/resolvers/zod";
  import { z } from "zod";
  import { FormFieldCol } from "@ui/components/typing";
  import { Input, Textarea } from "@ui/components";
  import { FieldError } from "@ui/components/field";

  const schema = z.object({
    name: z.string().min(1, "Tên không được để trống"),
    description: z.string().optional(),
  });

  type FormData = z.infer<typeof schema>;

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", description: "" },
  });
  ```
- Use FormFieldCol for form layout:
  ```typescript
  <Controller
    name="name"
    control={form.control}
    render={({ field, fieldState }) => (
      <FormFieldCol label="Tên" required>
        <Input
          {...field}
          className={fieldState.error ? "border-destructive" : ""}
        />
        {fieldState.error && <FieldError>{fieldState.error.message}</FieldError>}
      </FormFieldCol>
    )}
  />
  ```

### API Usage Guidelines

#### Using `@workspace/api-client`
- All API calls should use the SDK from `@workspace/api-client`:
  ```typescript
  import { api } from "@/lib/api";

  // ✅ Correct - use SDK methods
  const data = await api.moduleName.list({ page: 1, limit: 20 });
  await api.moduleName.create(input);
  await api.moduleName.update(id, input);
  await api.moduleName.remove(id);

  // ❌ Incorrect - avoid direct http calls
  const response = await api.http.get("/admin/module-name");
  ```

#### Using `@workspace/query-client` with React Query
- Use shared query hooks from `@/hooks/queries` when available
- For custom hooks, follow React Query pattern with proper cache invalidation

#### Using FormField Components
- `FormFieldCol` - Vertical layout (label above input)
- `FormFieldRow` - Horizontal layout (label beside input)
- Always use with Controller from react-hook-form for controlled components

## Common Patterns

All modules follow this structure:

### Backend Admin UI (Next.js)
- Main list page with pagination and filters
- New/Edit/Detail pages with routing
- Shared components in `_component/`:
  - `types.ts` - TypeScript types
  - `utils.ts` - Utility functions
  - `columns.tsx` - Table column definitions
  - `_hooks/` - Custom React hooks
  - `_query/` - React Query hooks
  - `_table/` - Table components
  - `_form/` - Form components
  - `_alert-dialog/` - Confirmation dialogs

### API Service (NestJS)
- Controller with HTTP endpoints
- Service with business logic
- Module definition
- DTOs for data transfer

## Module Differences

| Feature | Categories | Posts | Tags | Guides | Staff |
|---------|-----------|-------|------|--------|-------|
| **Data Model** | Hierarchical tree | Rich content | Flat with prefix tree | Steps with images | User with roles |
| **UI Pattern** | Tree view table | Data table | Prefix tree table | Card grid / Table | Data table with role filter |
| **Bulk Actions** | Yes (set-parent) | Yes (set-categories) | No | No | Yes (delete/restore/purge) |
| **API Pattern** | Direct API calls | Direct API calls | Direct API calls | SDK-based | Direct API calls |

## Quick Reference

### File Locations
- **Categories**: `apps/backend/src/app/categories/`
- **Posts**: `apps/backend/src/app/posts/`
- **Tags**: `apps/backend/src/app/tags/`
- **Guides**: `apps/backend/src/app/guides/`
- **Staff**: `apps/backend/src/app/staff/`

### Shared Types
- Categories: `@workspace/api-client` - `Category`, `CreateCategoryInput`, `UpdateCategoryInput`
- Posts: `@workspace/api-client` - `Post`, `CreatePostInput`, `UpdatePostInput`
- Tags: `@workspace/api-client` - `Tag`, `CreateTagInput`, `UpdateTagInput`
- Guides: `@workspace/api-client` - `PageContent` → `GuideGroup`, `PageContentStep` → `GuideStep`
- Staff: `@workspace/api-client` - `User`

## Notes

- All modules use React Hook Form with Zod validation
- All modules use React Query for data fetching
- All modules use UI components from `@ui/components`
- All modules use Lucide icons for consistency
- All modules have permission checks with `AdminPageGuard`
