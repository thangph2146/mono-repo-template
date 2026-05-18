# Tags Implementation Documentation

## Overview
This document provides detailed information about the Tags module implementation, including both the Backend Admin UI and the API service.

---

## Backend Admin UI (Next.js)

### Location
`apps/backend/src/app/tags/`

### File Structure
```
tags/
├── page.tsx                          # Main list page with list/trash tabs
├── new/
│   └── page.tsx                      # Create new tag page
├── [id]/
│   ├── page.tsx                      # View tag detail page
│   └── edit/
│       └── page.tsx                  # Edit tag page
└── _component/                       # Shared components
    ├── index.ts                      # Barrel exports
    ├── types.ts                      # TypeScript types
    ├── utils.ts                      # Utility functions
    ├── columns.tsx                   # Table column definitions
    ├── _hooks/                       # Custom React hooks
    │   ├── index.ts
    │   ├── use-tag-form.ts           # Form hook
    │   ├── use-tags-actions.ts       # Action handlers
    │   └── use-tags-filters.ts       # Filter handlers
    ├── _query/                       # React Query hooks
    │   ├── index.ts
    │   └── use-tags-queries.ts       # Query hooks
    ├── _table/                       # Table components
    │   ├── index.ts
    │   ├── tags-table.tsx            # Main tags table
    │   └── tags-trash-table.tsx      # Trash table
    ├── _form/                        # Form components
    │   ├── index.ts
    │   └── tag-form-shell.tsx        # Form shell component
    └── _alert-dialog/                # Alert dialogs
        ├── index.ts
        └── tags-confirm-dialog.tsx   # Confirmation dialog
```

### Key Components

#### Main Page (page.tsx)
- **Features**: List and trash tabs, search, column filters, tree view, bulk actions
- **State Management**: 
  - Main tab (list/trash)
  - Global filter (search)
  - Column filters
  - Row selection
- **Data Fetching**:
  - `useTagsListQuery` - Fetch all tags (no pagination for list view)
  - `useTrashQuery` - Fetch trashed tags with pagination
- **Mutations**:
  - `useMutation` - Delete, restore, purge
  - `useMutation` - Bulk operations
- **Permission Check**: `canWriteTags` based on `PERMISSION_CODES.TAGS_MANAGE`, `TAGS_CREATE`, `TAGS_UPDATE`

#### Tree Building
- **buildTagTree(rows)**: Builds hierarchical tree structure
  - Groups tags by prefix (tags with same prefix become parent groups)
  - Example: "react", "react-hooks" → "react" becomes parent of "react-hooks"
  - Sorts by name
  - Filters out group items from bulk operations

#### Form Hook (use-tag-form.ts)
- **Schema**: `tagFormSchema` with validation
  - `name`: string (required, min 1 char)
  - `slug`: string
- **Default Values**: Empty form state

#### Query Hooks (use-tags-queries.ts)
- **useTagsListQuery**: Fetch all tags (no pagination)
- **useTrashQuery**: Fetch trashed tags with pagination
- **useTagDetailQuery**: Fetch single tag by ID with posts

### Types (types.ts)
```typescript
export type TagRow = {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type TagTreeRow = TagRow & {
  isGroup?: boolean;
  itemCount?: number;
  subRows?: TagTreeRow[];
};

export interface TagConfirmAction {
  kind: "delete" | "restore" | "purge";
  row: TagRow;
}

export interface RelatedPost {
  id: string;
  title: string;
  slug: string;
  published: boolean;
  publishedAt: string | null;
  createdAt: string;
}

export interface TagDetail extends TagRow {
  postCount: number;
  posts: RelatedPost[];
}
```

### Utilities (utils.ts)
- **slugify**: Convert text to URL-friendly slug
- **humanizeSlug**: Convert slug back to readable text
- **sortTagsByName**: Sort tags by name (Vietnamese locale)
- **buildTagTree**: Build hierarchical tree based on name prefixes
- **buildTagsFilterQuery**: Convert column filters to API query
- **toFilterQuery**: Helper for filter queries
- **buildTagPayload**: Prepare form data for API submission

### Tree Building Logic
The tree is built by grouping tags with common prefixes:
1. Split tag names by hyphens
2. Tags with same prefix become children of the prefix
3. Example:
   - "react" → parent group
   - "react-hooks" → child of "react"
   - "vue" → separate parent group
   - "vue-router" → child of "vue"
4. Group items are marked with `isGroup: true`
5. Group items cannot be selected for bulk operations

### Permissions
- Required roles: `super_admin`, `admin`, `manager`
- Permission codes: `tags.read`, `tags.manage`, `tags.create`, `tags.update`
- UI shows read-only warning if user lacks write permissions
- Write permission = any of: `tags.manage`, `tags.create`, `tags.update`

---

## API Service (NestJS)

### Location
`apps/api/src/tags/`

### File Structure
```
tags/
├── tags.controller.ts                 # HTTP endpoints
├── tags.service.ts                    # Business logic
└── tags.module.ts                     # Module definition
```

### Controller Endpoints

#### GET /admin/tags
- **Description**: List tags with pagination and filters
- **Headers**: `X-User-Id` (required)
- **Query Params**:
  - `page`: number (default: 1)
  - `limit`: number (default: 10, max: 100)
  - `search`: string (search in name, slug)
  - `status`: 'active' | 'deleted' | 'all' (default: 'active')
  - `filter[key]`: string (column filters)
- **Response**: `{ data: TagRowDto[], pagination: {...} }`

#### GET /admin/tags/options
- **Description**: Get options for dropdown filters
- **Query Params**:
  - `column`: string (default: 'name')
  - `search`: string
  - `limit`: number (default: 50, max: 100)
- **Response**: `Array<{ label: string, value: string }>`

#### GET /admin/tags/:id
- **Description**: Get single tag by ID with posts
- **Response**: `TagDetailDto`

#### POST /admin/tags
- **Description**: Create new tag
- **Body**:
  ```typescript
  {
    name: string;
    slug: string;
  }
  ```
- **Response**: `TagRowDto` (status 201)

#### PUT /admin/tags/:id
- **Description**: Update existing tag
- **Body**:
  ```typescript
  {
    name?: string;
    slug?: string;
  }
  ```
- **Response**: `TagRowDto`

#### POST /admin/tags/bulk
- **Description**: Bulk operations on tags
- **Body**:
  ```typescript
  {
    action: 'delete' | 'restore' | 'hard-delete';
    ids: string[];
  }
  ```
- **Response**: `{ affected: number, message: string }`

#### DELETE /admin/tags/:id
- **Description**: Soft delete tag
- **Response**: `{ message: string }`

#### DELETE /admin/tags/:id/hard-delete
- **Description**: Permanently delete tag
- **Response**: `{ message: string }`

#### POST /admin/tags/:id/restore
- **Description**: Restore trashed tag
- **Response**: `{ message: string }`

### Service Methods

#### TagsService
- **list(params)**: List tags with pagination and filters
- **getOptions(column, search, limit)**: Get dropdown options
- **getById(id)**: Get single tag with posts
- **create(data)**: Create new tag
- **update(id, data)**: Update tag
- **softDelete(id)**: Soft delete
- **restore(id)**: Restore from trash
- **hardDelete(id)**: Permanent delete
- **bulk(action, ids)**: Bulk operations

### Key Features

#### Simple Data Model
- Tags are flat (no hierarchical structure like categories)
- Only name and slug fields
- Related to posts via many-to-many relationship

#### Post Count
- **getById** includes post count and related posts
- Posts are ordered by createdAt DESC
- Limited to 10 related posts in detail view

#### Date Filtering
- Supports date range filtering on `deletedAt` and `updatedAt`
- Format: `YYYY-MM-DD` or `YYYY-MM-DD,YYYY-MM-DD` for range
- Uses `$gte` and `$lte` operators

#### Bulk Operations
- Delete: Soft delete multiple tags
- Restore: Restore multiple trashed tags
- Hard delete: Permanently delete multiple tags
- All operations use native queries for performance

### Data Models

#### TagRowDto
```typescript
{
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}
```

#### TagDetailDto
```typescript
{
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  postCount: number;
  posts: RelatedPostDto[];
}
```

#### RelatedPostDto
```typescript
{
  id: string;
  title: string;
  slug: string;
  published: boolean;
  publishedAt: string | null;
  createdAt: string;
}
```

### Performance Optimizations
- Pagination with configurable limits
- Native bulk operations
- Index-based ordering
- Efficient date range queries
- Limited related posts in detail view (10 max)

### Error Handling
- Missing X-User-Id header → 401
- Not found → 404
- Server errors → 500 with detailed logging

### Logging
- Controller logs each API call
- Service logs errors with stack traces
- Activity logging via NotificationsService
- Audit trail for all CRUD operations

### Differences from Categories
- **Structure**: Flat vs hierarchical (categories have parent/child)
- **Fields**: Simpler (only name/slug) vs categories (description, icon, sortOrder)
- **Tree**: Client-side prefix-based tree vs server-side parent relationship
- **Post Count**: Direct count vs recursive descendant count
- **Bulk**: No set-parent action (no hierarchy)
- **List View**: No pagination for active tags (all loaded) vs paginated categories

### Client-Side Tree Logic
The tag tree is built entirely client-side based on naming conventions:
- Tags with common prefixes are grouped
- No database parent relationship
- Example: "react" becomes parent of "react-hooks", "react-redux"
- This is purely for UI organization
- Bulk operations filter out group items (`isGroup: true`)
