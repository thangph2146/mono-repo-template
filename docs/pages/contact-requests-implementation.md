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
- [ ] **Important**: Implement bulk mutations for better UX:
  - `bulkDeleteMutation` - bulk delete using `api.contactRequests.bulkDelete()`
  - `bulkRestoreMutation` - bulk restore using `api.contactRequests.bulkRestore()`
  - `bulkPurgeMutation` - bulk purge using `api.contactRequests.bulkPurge()`
- [ ] Use React Query mutations with proper cache invalidation
- [ ] Show toast notifications on success/error

**Note**: If API client doesn't have bulk methods, add them to `packages/api-client/src/resources/contact-requests.ts` first.

### Phase 6: Create Table Columns (`_component/columns.tsx`)

- [ ] Define column definitions with proper types
- [ ] Use status badges with appropriate colors based on CONTACT_REQUEST_STATUS_LABELS
- [ ] Add action buttons (view, edit, delete, restore, purge) using Lucide icons (Eye, Pencil, Trash2, RotateCcw, AlertTriangle)
- [ ] Format dates and phone numbers properly
- [ ] Add meta properties for filtering
- [ ] **UX Enhancement**: Add sticky positioning for key columns:
  - Add `meta.className: "sticky left-0 bg-background z-10 shadow"` to checkbox column (in AdminDataTable)
  - Add `meta.className: "sticky left-0 bg-background z-10 shadow"` to name column
  - Add `meta.className: "sticky right-0 bg-background z-10 shadow"` to actions column
  - Update AdminDataTable to support `meta.className` for both TableHead and TableCell
- [ ] **UX Enhancement**: Add line-clamp for text truncation:
  - Use `line-clamp-3` for text columns (name, email, content, address, program, major)
  - Use `line-clamp-1` for short fields (phone, subject)
- [ ] **Content Display**: For contact requests with structured content:
  - Parse content to extract structured fields (address, program, major, registration fields)
  - Display main message content separately from structured fields
  - Option 1: Display structured fields as badges in content column
  - Option 2: Create separate columns for address, program, major (recommended for better filtering)

### Phase 7: Create Table Components (`_component/_table/contact-table.tsx`)

- [ ] Create wrapper component around `AdminDataTable`
- [ ] Configure data, columns, pagination
- [ ] Add filters (search, status)
- [ ] Add tabs for Active/Trash items
- [ ] Handle row selection and bulk actions
- [ ] Handle module-specific table logic
- [ ] **Custom Export**: Implement custom CSV/XLSX export for structured data:
  - Create `buildCustomExportData()` function to parse structured content fields
  - Split structured content (address, program, major, registration fields) into separate columns
  - Add export buttons with custom handlers instead of using default `csvExport` prop
  - Do the same for trash table (`contact-trash-table.tsx`)

### Phase 7.5: Backend API Fixes

- [ ] **Fix Backend Controller**: Ensure trash parameter maps to status filter:
  - In `apps/api/src/contact-requests/contact-requests.controller.ts`
  - Map query parameter `trash=true` to `status='deleted'` in the list method
  - This ensures trashed items are properly filtered and returned with `deletedAt` field
- [ ] **Fix API Client**: Handle response structure correctly:
  - Ensure `normalizePagedResult` is used for list responses
  - Fix TypeScript types for `assignedTo` field (use concrete type instead of `any`)

### Phase 8: Create Form Shell (`_component/_form/contact-form-shell.tsx`)

- [ ] Define props interface with form state and callbacks
- [ ] Implement form layout with Dialog components
- [ ] Use FormFieldCol/FormFieldRow for form layout consistency
- [ ] Handle form submission with mutations
- [ ] Support both create and edit modes
- [ ] **UX Optimization**: Split form into structured fields for better UX:
  - Instead of single `message` textarea, create separate fields:
    - `address` - text input
    - `program` - text input or select
    - `major` - text input or select
    - `receiveAdmissionInfo` - checkbox/Switch component
    - `requestConsultation` - checkbox/Switch component
    - `message` - textarea for main message content
  - Use `Switch` component from `@ui/components` instead of native checkbox
  - Build payload to combine structured fields into formatted content string
- [ ] **UX Enhancement**: Optimize form layout:
  - Use grid layout for better responsive design
  - Group related fields together
  - Add proper spacing and visual hierarchy

### Phase 9: Create Confirm Dialog (`_component/_alert-dialog/contact-confirm-dialog.tsx`)

- [ ] Define props interface with action type, target, callbacks
- [ ] Use `AdminConfirmActionDialog` shared component
- [ ] Handle delete, restore, purge actions with appropriate icons and messages
- [ ] **Bulk Operations**: Add bulk confirmation dialogs:
  - `ContactBulkConfirmDialog` component for bulk delete/restore/purge
  - Support `action` prop: "delete" | "restore" | "purge"
  - Support `target` prop: "selected" for bulk operations
  - Display count of selected items
  - Show appropriate icons and messages based on action type

### Phase 10: Implement Main List Page (`page.tsx`)

- [ ] Import query hooks and table components from `_component`
- [ ] Import shared hooks from `@/hooks/queries`
- [ ] Use table component from `_component/_table/contact-table.tsx`
- [ ] Add filters (search, status)
- [ ] Add tabs for Active/Trash items using state
- [ ] Wrap with `AdminPageGuard` for permission check (super_admin, admin roles)
- [ ] Use correct route paths (e.g., `/contact-requests` not `/admin/contact-requests`)
- [ ] **UX Decision**: Consider removing "Add New" button:
  - Contact requests are typically submitted by users, not created by admins
  - If admin needs to create, use `/contact-requests/new` route
  - Remove button from main page to reduce clutter
- [ ] Handle pagination with page and pageSize state
- [ ] **Bulk Operations**: Use bulk mutations instead of individual item deletion:
  - Replace individual delete/restore/purge handlers with bulk mutation handlers
  - Remove unnecessary bulk target states and individual bulk confirm dialogs
  - Update busy state to reflect bulk operations

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
- [ ] **UX Enhancement**: Display structured content with badges:
  - Parse content to extract structured fields (address, program, major, registration fields)
  - Display structured fields as badges with icons
  - Use appropriate icons: MapPin for address, BookOpen for program, GraduationCap for major, Bell for registration
- [ ] **UX Enhancement**: Add priority, isRead, assignedTo display:
  - Display priority badge if available
  - Display read/unread status with visual indicator
  - Display assigned user if available
- [ ] **UX Fix**: Fix status badge case sensitivity:
  - Ensure status lookup is case-insensitive or normalize status values
  - Use CONTACT_REQUEST_STATUS_LABELS with proper key handling
- [ ] **UX Fix**: Fix layout breaks with grid responsive layout:
  - Use CSS Grid with responsive columns
  - Ensure cards don't break on smaller screens
- [ ] Add status update form using form shell (read-only for basic fields, editable for status and notes)
- [ ] Add "Edit" button linking to `/contact-requests/[id]/edit`
- [ ] Add "Delete" button with confirmation dialog
- [ ] Handle loading and error states
- [ ] Wrap with `AdminPageGuard` for permission check
- [ ] Add breadcrumb navigation
- [ ] **UX Decision**: Consider removing notes card:
  - If notes are not frequently used, remove the notes card to reduce clutter
  - Notes can be edited in the status update form instead

### Phase 13: Implement Edit Page (`[id]/edit/page.tsx`)

- [ ] Import `useContactRequestDetail` from `@/hooks/queries`
- [ ] Fetch contact request data by ID
- [ ] Import form hook and form shell from `_component`
- [ ] Use `contact-form-shell` component for edit mode
- [ ] **UX Enhancement**: Add back button for navigation
  - Add back button in the header or breadcrumb
  - Navigate back to detail page on click
- [ ] **Data Fix**: Fix edit form populate to use content field from API:
  - Parse content field from API response
  - Extract structured fields and populate form fields accordingly
  - Handle both old format (single message) and new format (structured fields)
- [ ] Populate form with existing data
- [ ] Set form mode to "edit"
- [ ] Handle form submission with updateMutation
- [ ] Redirect to detail page on success
- [ ] Wrap with `AdminPageGuard` for permission check
- [ ] Add breadcrumb navigation

## Common Issues and Fixes

### Issue 1: Sticky Positioning Not Working
**Problem**: Sticky columns don't stick when scrolling horizontally.
**Solution**:
- Ensure table container has `overflow-x-auto` class
- Add sticky classes to column meta: `meta.className: "sticky left-0 bg-background z-10 shadow"`
- Update AdminDataTable to apply meta.className to both TableHead and TableCell
- Use `(cell.column.columnDef.meta as any)?.className` to avoid TypeScript errors
- Add `bg-background` to ensure opaque background when content scrolls underneath

### Issue 2: Status Badge Case Sensitivity
**Problem**: Status badges don't display correctly due to case mismatch (e.g., "New" vs "new").
**Solution**:
- Normalize status values before lookup: `status.toLowerCase()`
- Or ensure all status values are stored in lowercase
- Use case-insensitive lookup in CONTACT_REQUEST_STATUS_LABELS

### Issue 3: Trash Items Not Showing
**Problem**: Trash tab doesn't show deleted items.
**Solution**:
- Check backend controller: ensure `trash` query parameter maps to `status='deleted'`
- In controller, add: `if (trash) query.status = 'deleted';`
- Ensure API client passes `trash` parameter correctly

### Issue 4: CSV Export Shows Raw Content
**Problem**: CSV export shows full content string instead of parsed structured fields.
**Solution**:
- Create custom export function `buildCustomExportData()`
- Parse structured content fields (address, program, major, etc.)
- Create separate columns for each structured field in export
- Use custom export handlers instead of default `csvExport` prop

### Issue 5: Edit Form Not Populating Correctly
**Problem**: Edit form doesn't populate with existing data, especially content field.
**Solution**:
- Parse content field from API response
- Extract structured fields and populate form fields accordingly
- Handle both old format (single message) and new format (structured fields)
- Use `populateForm()` helper to set form values

### Issue 6: Bulk Operations Not Working
**Problem**: Bulk delete/restore/purge doesn't work.
**Solution**:
- Ensure API client has bulk methods: `bulkDelete()`, `bulkRestore()`, `bulkPurge()`
- Implement bulk mutations in query hooks
- Use bulk confirmation dialog with `target="selected"`
- Pass array of IDs to bulk API methods

### Issue 7: Layout Breaks on Smaller Screens
**Problem**: Detail page cards break layout on smaller screens.
**Solution**:
- Use CSS Grid with responsive columns: `grid-cols-1 md:grid-cols-2`
- Ensure min-width constraints on table cells
- Test on different screen sizes

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
- [ ] **Sticky Columns**: Checkbox, Name, and Actions columns stick when scrolling horizontally
- [ ] **Line Clamp**: Text columns truncate correctly at 3 lines (name, email, content, address, program, major)
- [ ] **Structured Content**: Content column displays only message, not structured fields
- [ ] **Separate Columns**: Address, Program, Major columns display parsed structured data correctly
- [ ] "Add New" button navigates to create page (if present)
- [ ] Delete action soft deletes item (moves to trash)
- [ ] Restore action restores item from trash
- [ ] Purge action permanently deletes item from trash
- [ ] **Bulk Operations**: Bulk delete/restore/purge work correctly
- [ ] **Bulk Confirmation**: Bulk confirmation dialogs show correct count and messages
- [ ] **Custom Export**: CSV/XLSX export splits structured data into separate columns

### Create Page
- [ ] Create page loads correctly
- [ ] Form validation works for all required fields
- [ ] **Structured Fields**: Form has separate fields for address, program, major, registration checkboxes
- [ ] **Switch Component**: Boolean fields use Switch component instead of native checkbox
- [ ] Submit creates new contact request
- [ ] Success toast displays
- [ ] Redirects to list page on success
- [ ] Breadcrumb navigation works
- [ ] **Payload Building**: Structured fields are combined into formatted content string

### Detail Page
- [ ] Detail page loads correctly with ID
- [ ] All information displays correctly
- [ ] **Structured Content**: Structured fields display as badges with icons
- [ ] **Priority/Read/Assigned**: Priority, read status, and assigned user display correctly
- [ ] Status update works
- [ ] Notes update works (if notes card is present)
- [ ] **Grid Layout**: Cards use responsive grid layout, don't break on smaller screens
- [ ] "Edit" button navigates to edit page
- [ ] "Delete" button shows confirmation dialog
- [ ] Breadcrumb navigation works
- [ ] **Back Button**: Edit page has back button to navigate back to detail page

### Edit Page
- [ ] Edit page loads correctly with ID
- [ ] **Form Populate**: Form populates with existing data, including structured fields from content
- [ ] Form validation works
- [ ] Submit updates contact request
- [ ] Success toast displays
- [ ] Redirects to detail page on success
- [ ] Breadcrumb navigation works

### Backend API
- [ ] **Trash Parameter**: Trash query parameter maps to status='deleted' in controller
- [ ] **Bulk Methods**: API client has bulkDelete, bulkRestore, bulkPurge methods
- [ ] **Response Structure**: normalizePagedResult handles list responses correctly
- [ ] **Type Safety**: assignedTo field uses concrete type instead of any

### General
- [ ] Permission checks prevent unauthorized access
- [ ] Loading states display correctly
- [ ] Error messages display correctly
- [ ] Route paths are correct (no /admin prefix)
- [ ] **AdminDataTable**: Supports meta.className for sticky positioning
