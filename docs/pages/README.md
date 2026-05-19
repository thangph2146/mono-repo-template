# Pages Implementation Documentation

> This directory contains detailed task lists for implementing admin pages in the backend application. Each document provides step-by-step instructions for AI coding to ensure clean, consistent code.

## Available Implementation Guides

- **[Categories Implementation](./categories-implementation.md)** - Task list for implementing the Categories module with hierarchical tree structure, parent-child relationships, and bulk operations.

- **[Posts Implementation](./posts-implementation.md)** - Task list for implementing the Posts module with rich text editor, taxonomy (categories/tags), and publishing workflow.

- **[Tags Implementation](./tags-implementation.md)** - Task list for implementing the Tags module with client-side prefix-based tree grouping and flat data model.

- **[Guides Implementation](./guides-implementation.md)** - Task list for implementing the Guides module with step-by-step instructions, image uploads, and SDK-based API integration.

- **[Staff Implementation](./staff-implementation.md)** - Task list for implementing the Staff module with user management, role assignment, and soft-delete functionality.

## How to Use

1. **Before implementing**: Read the relevant implementation guide for the module you're working on.
2. **Follow the phases**: Each guide is divided into phases (Phase 1, Phase 2, etc.) that should be completed in order.
3. **Check off tasks**: Each phase has a checklist of tasks. Complete them one by one.
4. **Test thoroughly**: After implementation, use the Testing Checklist at the end of each guide to verify functionality.
5. **Follow clean code guidelines**: Refer to the Clean Code Guidelines section for best practices.

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
