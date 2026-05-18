# Categories Implementation Documentation

## Overview
This document provides detailed information about the Categories module implementation, including both the Backend Admin UI and the API service.

---

## Backend Admin UI (Next.js)

### Location
`apps/backend/src/app/categories/`

### File Structure
```
categories/
├── page.tsx                          # Main list page with list/trash tabs
├── new/
│   └── page.tsx                      # Create new category page
├── [id]/
│   ├── page.tsx                      # View category detail page
│   └── edit/
│       └── page.tsx                  # Edit category page
└── _component/                       # Shared components
    ├── index.ts                      # Barrel exports
    ├── types.ts                      # TypeScript types
    ├── utils.ts                      # Utility functions
    ├── columns.tsx                   # Table column definitions
    ├── _hooks/                       # Custom React hooks
    │   ├── index.ts
    │   ├── use-category-form.ts      # Form hook
    │   ├── use-categories-actions.ts # Action handlers
    │   └── use-categories-filters.ts # Filter handlers
    ├── _query/                       # React Query hooks
    │   ├── index.ts
    │   └── use-categories-queries.ts # Query hooks
    ├── _table/                       # Table components
    │   ├── index.ts
    │   ├── categories-table.tsx      # Main categories table
    │   └── categories-trash-table.tsx # Trash table
    ├── _form/                        # Form components
    │   ├── index.ts
    │   └── category-form-shell.tsx   # Form shell component
    └── _alert-dialog/                # Alert dialogs
        ├── index.ts
        └── categories-confirm-dialog.tsx # Confirmation dialog
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
  - `useCategoriesQuery` - Fetch categories list
  - `useTrashQuery` - Fetch trashed categories
  - `useCategoriesOptionsQuery` - Fetch category tree for dropdown
- **Mutations**:
  - `useMutation` - Delete, restore, purge
  - `useMutation` - Bulk operations
- **Permission Check**: `canWriteCategories` based on `PERMISSION_CODES.CATEGORIES_WRITE`

#### Tree Building
- **buildCategoryTree(rows)**: Builds hierarchical tree structure
  - Maps categories by ID
  - Links children to parents
  - Sorts by name (Vietnamese locale)
  - Recursive sorting for nested children

#### Form Hook (use-category-form.ts)
- **Schema**: `categoryFormSchema` with validation
  - `id`: string (optional)
  - `name`: string (required)
  - `slug`: string (required)
  - `description`: string
  - `icon`: string
  - `sortOrder`: number
  - `parentId`: string
- **Default Values**: Empty form state

#### Query Hooks (use-categories-queries.ts)
- **useCategoriesQuery**: Fetch categories with search and filters
- **useTrashQuery**: Fetch trashed categories
- **useCategoryDetailQuery**: Fetch single category by ID with children and posts
- **useCategoriesOptionsQuery**: Fetch category tree for dropdown

### Types (types.ts)
```typescript
export interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  parentName: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  icon: string | null;
  sortOrder: number;
  _count: { children: number };
  postCount: number;
  subRows?: CategoryRow[];
}

export interface CategoryConfirmAction {
  kind: "delete" | "restore" | "purge";
  row: CategoryRow;
}

export interface FormState {
  id?: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  sortOrder: number;
  parentId: string;
}
```

### Utilities (utils.ts)
- **slugify**: Convert text to URL-friendly slug
- **buildCategoryOptionTree**: Build hierarchical category tree for dropdowns
- **buildCategoriesFilterQuery**: Convert column filters to API query
- **formatDateTime**: Format date/time for display
- **buildCategoryPayload**: Prepare form data for API submission

### Permissions
- Required roles: `super_admin`, `admin`, `manager`
- Permission codes: `categories.read`, `categories.write`
- UI shows read-only warning if user lacks `categories.write` permission

---

## API Service (NestJS)

### Location
`apps/api/src/categories/`

### File Structure
```
categories/
├── categories.controller.ts           # HTTP endpoints
├── categories.service.ts              # Business logic
└── categories.module.ts               # Module definition
```

### Controller Endpoints

#### GET /admin/categories
- **Description**: List categories with pagination and filters
- **Headers**: `X-User-Id` (required)
- **Query Params**:
  - `page`: number (default: 1)
  - `limit`: number (default: 10, max: 1000)
  - `search`: string (search in name, slug, description)
  - `status`: 'active' | 'deleted' | 'all' (default: 'active')
  - `filter[key]`: string (column filters)
- **Response**: `{ data: CategoryRowDto[], pagination: {...} }`

#### GET /admin/categories/options
- **Description**: Get options for dropdown filters
- **Query Params**:
  - `column`: string (default: 'name')
  - `search`: string
  - `limit`: number (default: 50, max: 100)
- **Response**: `Array<{ label: string, value: string }>`

#### GET /admin/categories/:id
- **Description**: Get single category by ID with children and posts
- **Response**: `CategoryDetailDto`

#### POST /admin/categories
- **Description**: Create new category
- **Body**:
  ```typescript
  {
    name: string;
    slug: string;
    description?: string | null;
    parentId?: string | null;
  }
  ```
- **Response**: `CategoryRowDto` (status 201)

#### PUT /admin/categories/:id
- **Description**: Update existing category
- **Body**: Same as create (all fields optional except id)
- **Response**: `CategoryRowDto`

#### POST /admin/categories/bulk
- **Description**: Bulk operations on categories
- **Body**:
  ```typescript
  {
    action: 'delete' | 'restore' | 'hard-delete' | 'set-parent';
    ids: string[];
    parentId?: string | null; // for set-parent action
  }
  ```
- **Response**: `{ affected: number, message: string }`

#### DELETE /admin/categories/:id
- **Description**: Soft delete category
- **Response**: `{ message: string }`

#### DELETE /admin/categories/:id/hard-delete
- **Description**: Permanently delete category
- **Response**: `{ message: string }`

#### POST /admin/categories/:id/restore
- **Description**: Restore trashed category
- **Response**: `{ message: string }`

### Service Methods

#### CategoriesService
- **list(params)**: List categories with pagination and filters
- **getOptions(column, search, limit)**: Get dropdown options
- **getById(id)**: Get single category with children and posts
- **create(data)**: Create new category
- **update(id, data)**: Update category
- **softDelete(id)**: Soft delete
- **restore(id)**: Restore from trash
- **hardDelete(id)**: Permanent delete
- **bulk(action, ids, parentId)**: Bulk operations

### Key Features

#### Category Tree Traversal
- **collectCategoryDescendantIds(rootId)**: Recursively collect all descendant IDs
  - BFS traversal with safety limits
  - Safety: 50 levels max, 10,000 nodes max
  - Used for filtering posts by category tree
  - Used for validating parent changes (prevent cycles)

#### Post Count Calculation
- **countPostsByCategoryTree(categoryId)**: Count posts in category and all descendants
  - Includes posts from all child categories
  - Used for display in list and detail views

#### Tree Post Count Optimization
- For active status: Resolves tree post count for each row
- For deleted/trash status: Returns 0 for post count
- Parallel execution for performance

#### Parent Change Validation
- Prevents setting parent to self
- Prevents creating cycles in the tree
- Validates parent exists and is not deleted
- Uses descendant collection to detect cycles

#### Bulk Set Parent
- Validates no cycles will be created
- Validates parent exists
- Updates multiple categories at once
- Returns count of affected categories

### Data Models

#### CategoryRowDto
```typescript
{
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  parentName: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  _count?: { children: number };
  postCount?: number;
  children?: ChildCategoryDto[];
  posts?: RelatedPostDto[];
}
```

#### ChildCategoryDto
```typescript
{
  id: string;
  name: string;
  slug: string;
  _count: { children: number };
  postCount: number;
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

#### CategoryDetailDto
Extends CategoryRowDto with full children and posts arrays

### Performance Optimizations
- Pagination with high limit (1000) for tree views
- Parallel post count calculation
- Native bulk operations
- Efficient tree traversal with safety limits
- Index-based ordering

### Error Handling
- Missing X-User-Id header → 401
- Invalid parent (cycle) → 400
- Parent not found → 400
- Not found → 404
- Server errors → 500 with detailed logging

### Logging
- Controller logs each API call
- Service logs errors with stack traces
- Activity logging via NotificationsService
- Audit trail for all CRUD operations

### Tree Structure Notes
- Categories support unlimited nesting (with safety limits)
- Tree is built client-side for display
- Server returns flat list with parent references
- Post counts include all descendants
- Sort order: Vietnamese locale by name
