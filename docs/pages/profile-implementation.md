# Profile Implementation - Task List

> This document provides a detailed task list for implementing the Profile module. Follow these steps in order to ensure clean, consistent code.

---

## Backend Admin UI (Next.js)

**Location**: `apps/backend/src/app/profile/`

### Phase 1: Setup File Structure

- [ ] Create directory structure:
  ```
  profile/
  └── page.tsx
  ```

### Phase 2: Implement Main Profile Page (`page.tsx`)

- [ ] Import shared hooks from `@/hooks/queries`:
  - `useStaffProfile` - for fetching profile data
  - `useUpdateStaffProfile` - for updating profile
  - `useChangeStaffPassword` - for changing password
  - `useRbacCatalog` - for fetching roles and permissions
- [ ] Import UI components from `@ui/components` (Card, Button, Input, Label, Textarea, Table, etc.)
- [ ] Import Lucide icons (UserCircle, Shield, MapPin, etc.)
- [ ] Display profile information:
  - Name, email, phone, address
  - Roles and permissions
  - Account creation date
- [ ] Create profile form with React Hook Form and zodResolver:
  ```typescript
  import { useForm, Controller } from "react-hook-form";
  import { zodResolver } from "@hookform/resolvers/zod";
  import { z } from "zod";
  import { FormFieldCol } from "@ui/components/typing";
  import { Input, Textarea } from "@ui/components";
  import { FieldError } from "@ui/components/field";

  const profileSchema = z.object({
    fullName: z.string().min(1, "Họ tên không được để trống"),
    phone: z.string().optional(),
    address: z.string().optional(),
    bio: z.string().optional(),
  });

  type ProfileFormData = z.infer<typeof profileSchema>;

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: profile?.fullName ?? "",
      phone: profile?.phone ?? "",
      address: profile?.address ?? "",
      bio: profile?.bio ?? "",
    },
  });
  ```
- [ ] Use FormFieldCol for profile form fields:
  ```typescript
  <Controller
    name="fullName"
    control={profileForm.control}
    render={({ field, fieldState }) => (
      <FormFieldCol label="Họ tên" required>
        <Input
          {...field}
          className={fieldState.error ? "border-destructive" : ""}
        />
        {fieldState.error && <FieldError>{fieldState.error.message}</FieldError>}
      </FormFieldCol>
    )}
  />
  ```
- [ ] Create password change form with React Hook Form and zodResolver:
  ```typescript
  const passwordSchema = z
    .object({
      currentPassword: z.string().min(1, "Mật khẩu hiện tại không được để trống"),
      newPassword: z.string().min(6, "Mật khẩu mới tối thiểu 6 ký tự"),
      confirmPassword: z.string().min(1, "Xác nhận mật khẩu không được để trống"),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: "Mật khẩu xác nhận không khớp",
      path: ["confirmPassword"],
    });

  type PasswordFormData = z.infer<typeof passwordSchema>;

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });
  ```
- [ ] Use FormFieldCol for password form fields with Input type="password"
- [ ] Update session on profile change using `patchAdminSessionProfile`
- [ ] Show toast notifications on success/error
- [ ] Display permissions grouped by category
- [ ] Use `Container` component for layout
- [ ] Use proper typography classes from layout-shell (ADMIN_PAGE_TITLE_PROFILE_CLASS, etc.)

## Clean Code Guidelines

- Use TypeScript interfaces for type safety
- Follow the established naming conventions
- Keep components focused and reusable
- Use React Hook Form with Zod validation
- Use React Query for data fetching and caching
- Handle loading and error states appropriately
- Use UI components from `@ui/components`
- Use Lucide icons for consistency

## Testing Checklist

- [ ] Profile page loads correctly
- [ ] Profile form displays current data
- [ ] Profile update saves successfully
- [ ] Password form validates correctly
- [ ] Password change works with correct current password
- [ ] Password change fails with wrong current password
- [ ] Roles display correctly
- [ ] Permissions display correctly grouped by category
- [ ] Loading states display correctly
- [ ] Error messages display correctly
- [ ] Session updates after profile change
