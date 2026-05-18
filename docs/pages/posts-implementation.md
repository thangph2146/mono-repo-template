# Posts Implementation Documentation

## Overview
This document provides detailed information about the Posts module implementation, including both the Backend Admin UI and the API service.

---

## Backend Admin UI (Next.js)

### Location
`apps/backend/src/app/posts/`

### File Structure
```
posts/
├── page.tsx                          # Main list page with list/trash tabs
├── new/
│   └── page.tsx                      # Create new post page
├── [id]/
│   ├── page.tsx                      # View post detail page
│   └── edit/
│       └── page.tsx                  # Edit post page
└── _component/                       # Shared components
    ├── index.ts                      # Barrel exports
    ├── types.ts                      # TypeScript types
    ├── utils.ts                      # Utility functions
    ├── summary-badges.tsx            # Summary badges component
    ├── columns.tsx                   # Table column definitions
    ├── _hooks/                       # Custom React hooks
    │   ├── index.ts
    │   ├── use-post-form.ts          # Form hook
    │   ├── use-posts-actions.ts      # Action handlers
    │   └── use-posts-filters.ts      # Filter handlers
    ├── _query/                       # React Query hooks
    │   ├── index.ts
    │   ├── use-posts-queries.ts      # Query hooks
    │   ├── use-posts-mutations.ts    # Mutation hooks
    │   └── use-taxonomy-queries.ts   # Taxonomy query hooks
    ├── _table/                       # Table components
    │   ├── index.ts
    │   ├── posts-table.tsx           # Main posts table
    │   └── posts-trash-table.tsx     # Trash table
    ├── _form/                        # Form components
    │   ├── index.ts
    │   └── post-form-shell.tsx       # Form shell component
    └── _alert-dialog/                # Alert dialogs
        ├── index.ts
        └── posts-confirm-dialog.tsx  # Confirmation dialog
```

### Key Components

#### Main Page (page.tsx)
- **Features**: List and trash tabs, search, column filters, pagination, bulk actions
- **State Management**: 
  - Main tab (list/trash)
  - Pagination (page, pageSize)
  - Global filter (search)
  - Column filters
  - Row selection
- **Data Fetching**:
  - `usePostsQuery` - Fetch posts list
  - `useTrashQuery` - Fetch trashed posts
  - `useCategoriesQuery` - Fetch categories for filters
  - `useTagsQuery` - Fetch tags for filters
- **Mutations**:
  - `useDeleteMutation` - Soft delete posts
  - `useRestoreMutation` - Restore trashed posts
  - `usePurgeMutation` - Hard delete posts
  - `useBulkMutation` - Bulk operations

#### Form Hook (use-post-form.ts)
- **Schema**: `postFormSchema` with validation
  - `id`: string (optional)
  - `title`: string (required)
  - `slug`: string
  - `excerpt`: string
  - `image`: string
  - `content`: Record<string, any> (editor state)
  - `published`: boolean
  - `publishedAt`: string
  - `categoryIds`: string[]
  - `tagIds`: string[]
- **Default Values**: Empty editor state with one paragraph

#### Query Hooks (use-posts-queries.ts)
- **usePostsQuery**: Fetch posts with pagination, search, and filters
- **useTrashQuery**: Fetch trashed posts
- **usePostDetailQuery**: Fetch single post by ID
- **useCategoriesQuery**: Fetch categories for dropdown
- **useTagsQuery**: Fetch tags for dropdown

#### Mutation Hooks (use-posts-mutations.ts)
- **useDeleteMutation**: Soft delete with cache invalidation
- **useRestoreMutation**: Restore from trash
- **usePurgeMutation**: Permanent delete
- **useBulkMutation**: Bulk operations (delete, restore, hard-delete)

### Types (types.ts)
```typescript
export type TaxonomyOption = {
  id: string;
  name: string;
};

export type PostListRow = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  image: string | null;
  published: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  author: {
    id: string;
    name: string | null;
    email: string;
  };
  categories: TaxonomyOption[];
  tags: TaxonomyOption[];
};

export type PostConfirmAction =
  | { kind: "delete"; row: PostListRow }
  | { kind: "restore"; row: PostListRow }
  | { kind: "purge"; row: PostListRow };
```

### Utilities (utils.ts)
- **slugify**: Convert text to URL-friendly slug
- **getSeoStatus**: Calculate SEO status based on title, slug, excerpt
- **buildCategoryOptionTree**: Build hierarchical category tree
- **buildPostsFilterQuery**: Convert column filters to API query
- **formatDateTime**: Format date/time for display
- **normalizeContentForEditor**: Prepare content for editor

### Permissions
- Required roles: `super_admin`, `admin`, `manager`
- Permission codes: `posts.read`, `posts.write`, `posts.delete`

---

## API Service (NestJS)

### Location
`apps/api/src/posts/`

### File Structure
```
posts/
├── posts.controller.ts                # HTTP endpoints
├── posts.service.ts                   # Business logic
├── posts.module.ts                    # Module definition
```

### Controller Endpoints

#### GET /admin/posts
- **Description**: List posts with pagination and filters
- **Headers**: `X-User-Id` (required)
- **Query Params**:
  - `page`: number (default: 1)
  - `limit`: number (default: 10, max: 100)
  - `search`: string (search in title, slug, excerpt)
  - `status`: 'active' | 'deleted' | 'all' (default: 'active')
  - `filter[key]`: string (column filters)
- **Response**: `{ data: PostRowDto[], pagination: {...} }`

#### GET /admin/posts/options
- **Description**: Get options for dropdown filters
- **Query Params**:
  - `column`: string (default: 'title')
  - `search`: string
  - `limit`: number (default: 50, max: 100)
- **Response**: `Array<{ label: string, value: string }>`

#### GET /admin/posts/dates-with-posts
- **Description**: Get dates that have published posts
- **Response**: `{ dates: string[] }`

#### GET /admin/posts/:id
- **Description**: Get single post by ID
- **Response**: `PostDetailDto`

#### POST /admin/posts
- **Description**: Create new post
- **Body**:
  ```typescript
  {
    title: string;
    slug: string;
    content?: unknown;
    excerpt?: string | null;
    image?: string | null;
    published?: boolean;
    publishedAt?: string | null;
    eventStartAt?: string | null;
    eventEndAt?: string | null;
    categoryIds?: string[];
    tagIds?: string[];
  }
  ```
- **Response**: `PostRowDto` (status 201)

#### PUT /admin/posts/:id
- **Description**: Update existing post
- **Body**: Same as create (all fields optional except id)
- **Response**: `PostRowDto`

#### POST /admin/posts/bulk
- **Description**: Bulk operations on posts
- **Body**:
  ```typescript
  {
    action: 'delete' | 'restore' | 'hard-delete' | 'set-categories' | 'clear-images';
    ids: string[];
    categoryIds?: string[]; // for set-categories action
    mode?: 'add' | 'replace'; // for set-categories action
  }
  ```
- **Response**: `{ affected: number, message: string }`

#### DELETE /admin/posts/:id
- **Description**: Soft delete post
- **Response**: `{ message: string }`

#### DELETE /admin/posts/:id/hard-delete
- **Description**: Permanently delete post
- **Response**: `{ message: string }`

#### POST /admin/posts/:id/restore
- **Description**: Restore trashed post
- **Response**: `{ message: string }`

### Service Methods

#### PostsService
- **list(params)**: List posts with pagination and filters
- **getOptions(column, search, limit)**: Get dropdown options
- **getById(id)**: Get single post
- **getDatesWithPosts()**: Get dates with published posts
- **create(authorId, data)**: Create new post
- **update(id, data)**: Update post
- **softDelete(id)**: Soft delete
- **restore(id)**: Restore from trash
- **hardDelete(id)**: Permanent delete
- **bulkSetCategories(ids, categoryIds, mode)**: Bulk set categories
- **bulkClearImages(ids)**: Bulk clear images
- **bulk(action, ids)**: Bulk operations

### Key Features

#### Category Tree Support
- Automatically includes descendant categories when filtering by parent
- Uses `collectCategoryDescendantIds()` to traverse category tree
- Safety limit: 50 levels, 10,000 nodes

#### Two-Step Query
- First query: Get IDs with pagination and ordering
- Second query: Fetch full data by IDs
- Preserves sort order from paginated query
- Avoids MySQL "Out of sort memory" errors

#### Relation Filters
- Resolves relation filters (categories, tags) from names to IDs
- Supports soft-delete aware filtering
- Uses `resolveRelationFilters()` helper

#### Validation
- Validates category IDs exist and are not deleted
- Validates tag IDs exist and are not deleted
- Validates author ID exists
- Validates date formats

### Data Models

#### PostRowDto
```typescript
{
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  image: string | null;
  published: boolean;
  publishedAt: string | null;
  eventStartAt: string | null;
  eventEndAt: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  author: { id: string; name: string | null; email: string };
  categories: Array<{ id: string; name: string }>;
  tags: Array<{ id: string; name: string }>;
}
```

#### PostDetailDto
Extends PostRowDto with `content: unknown`

### Performance Optimizations
- Pagination with configurable limits
- Two-step query for complex joins
- Native bulk operations
- Index-based ordering
- Efficient category tree traversal

### Error Handling
- Missing X-User-Id header → 401
- Invalid date formats → 400
- Missing required fields → 400
- Not found → 404
- Server errors → 500 with detailed logging

### Logging
- Controller logs each API call
- Service logs errors with stack traces
- Activity logging via NotificationsService
- Audit trail for all CRUD operations
