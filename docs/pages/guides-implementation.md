# Guides Implementation Documentation

## Overview

This document provides detailed information about the Guides module implementation, including both the Backend Admin UI and the API service.

---

## Backend Admin UI (Next.js)

### Location
`apps/backend/src/app/guides/`

### File Structure
```
guides/
├── page.tsx                          # Main list page with drag-drop reordering
└── _component/                       # Shared components
    ├── index.ts                      # Barrel exports (shared types + local)
    ├── types.ts                      # TypeScript types (local)
    ├── utils.ts                      # Utility functions
    ├── _hooks/                       # Custom React hooks
    │   ├── index.ts
    │   └── use-guides-actions.ts     # Form state & action handlers (SDK pattern)
    ├── _query/                       # React Query hooks (SDK pattern)
    │   ├── index.ts
    │   ├── use-guides-queries.ts     # Query hooks với api parameter
    │   └── use-guides-mutations.ts   # Mutation hooks với api parameter
    ├── _form/                        # Form components
    │   ├── index.ts
    │   ├── group-form-dialog.tsx     # Dialog tạo/sửa guide group
    │   ├── step-editor.tsx           # Quản lý danh sách bước
    │   └── image-upload-field.tsx    # Upload ảnh minh họa
    └── _components/                  # UI components
        ├── index.ts
        └── sortable-group-card.tsx   # Card kéo thả sắp xếp
```

### Key Components

#### Main Page (page.tsx)
- **Features**: Drag-drop reordering, search, pagination, CRUD operations
- **State Management**: 
  - Search filter
  - Pagination (page, limit)
  - Local groups (for drag-drop optimistic updates)
  - Reordering ref (to prevent sync during drag)
- **Data Fetching**:
  - `useGuidesQuery({ api, page, limit, search })` - Fetch guides with SDK
- **Mutations**:
  - `useCreateGuideMutation` - Create guide with `api` parameter
  - `useUpdateGuideMutation` - Update guide with `api` parameter
  - `useDeleteGuideMutation` - Delete guide with `api` parameter
  - `useReorderGuidesMutation` - Reorder guides with `api` parameter

#### Shared Types (@workspace/api-client)
```typescript
export interface PageContentStep {
  order: number;
  title: string;
  description: string;
  imageUrl?: string | null;
}

export interface PageContent {
  id: string;
  pageKey: string;
  sectionKey: string;
  isVisible: boolean;
  content: {
    title?: string | null;
    description?: string | null;
    order?: number;
    steps?: PageContentStep[];
  };
  deletedAt?: string | null;
}

// Aliases cho Guides
export type GuideStep = PageContentStep;
export type GuideGroup = PageContent;
```

#### Local Types (types.ts)
```typescript
export interface ListResult {
  data: GuideGroup[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export interface GuideFormData {
  sectionKey: string;
  isVisible: boolean;
  content: GuideGroup["content"];
}

export interface UpdateGuideData {
  isVisible: boolean;
  content: GuideGroup["content"];
}
```

#### Query Hooks Pattern (SDK)
```typescript
// use-guides-queries.ts
export interface UseGuidesQueryProps {
  api: StoreSyncSdk;
  page: number;
  limit?: number;
  search?: string;
}

export function useGuidesQuery({ api, page, limit, search }) {
  return useQuery({
    queryKey: ["admin", "guides", page, search],
    queryFn: async () => {
      const payload = await api.guides.list<GuideGroup>({ page, limit, search });
      return { data: payload.items, pagination: { ... } };
    },
  });
}
```

#### Mutation Hooks Pattern (SDK)
```typescript
// use-guides-mutations.ts
interface CreateGuideVariables {
  api: StoreSyncSdk;
  data: GuideFormData;
  nextOrder: number;
}

async function createGuide({ api, data, nextOrder }: CreateGuideVariables) {
  await api.guides.create({
    pageKey: PAGE_KEY,
    sectionKey: data.sectionKey,
    isVisible: data.isVisible,
    content: { ...data.content, order: nextOrder },
  });
}
```

#### Actions Hook Pattern
```typescript
// use-guides-actions.ts
interface UseGuidesActionsOptions {
  api: StoreSyncSdk;
  groups: GuideGroup[];
}

export function useGuidesActions({ api, groups }: UseGuidesActionsOptions) {
  const createMutation = useCreateGuideMutation();
  
  const handleSave = useCallback((data: GuideFormData) => {
    if (editTarget) {
      updateMutation.mutate({ api, id: editTarget.id, data: { ... } });
    } else {
      createMutation.mutate({ api, data, nextOrder: groups.length + 1 });
    }
  }, [api, groups.length]);
  
  return { handleSave, handleDelete, handleReorder, ... };
}
```

### Utilities (utils.ts)
- **parseContent**: Parse JSON content từ API về dạng chuẩn
- **apiBase**: Lấy base URL của API
- **authHeaders**: Tạo headers auth với X-User-Id
- **uploadImage**: Upload ảnh lên `/admin/uploads`
- **sortGroupsByOrder**: Sắp xếp groups theo order
- **reorderSteps**: Reorder steps sau khi drag-drop

---

## API Service (@workspace/api-client)

### Location
`packages/api-client/src/resources/guides.ts`

### SDK Integration
```typescript
import { createStoreSyncSdk } from "@workspace/api-client";

const api = createStoreSyncSdk({ baseUrl: "http://localhost:3002/api" });

// List guides
const { items, total } = await api.guides.list<GuideGroup>({
  page: 1,
  limit: 50,
  search: "huong-dan-su-dung",
});

// Get guide by id
const guide = await api.guides.get<GuideGroup>(id);

// Create guide
await api.guides.create({
  pageKey: "huong-dan-su-dung",
  sectionKey: "dang-nhap",
  isVisible: true,
  content: { title: "Hướng dẫn đăng nhập", steps: [...] },
});

// Update guide
await api.guides.update(id, { isVisible: false, content: { ... } });

// Delete guide
await api.guides.remove(id);
```

### GuidesApi Methods
- **list(params)**: List guides with pagination and filters
- **get(id)**: Get single guide by ID
- **create(body)**: Create new guide
- **update(id, body)**: Update guide
- **remove(id)**: Soft delete guide
- **restore(id)**: Restore trashed guide
- **purge(id)**: Hard delete guide
- **bulk(body)**: Bulk operations

---

## Differences from Posts/Categories/Tags

| Feature | Guides | Posts/Categories/Tags |
|---------|--------|----------------------|
| **Data Model** | PageContent (pageKey + sectionKey) | Posts/Categories/Tags entities |
| **Content** | JSON content with steps | Editor content / metadata |
| **UI Pattern** | Drag-drop card grid | Data table with filters |
| **Pagination** | Yes (50 items/page) | Yes (configurable) |
| **Tree Structure** | Flat (order by content.order) | Categories: hierarchical tree |
| **Filters** | Search only | Column filters, global search |
| **Bulk Actions** | Single operations only | Bulk delete/restore/purge |

---

## Shared Types from @workspace/api-client

### Types (types.ts)
- `PageContent` / `GuideGroup` - Entity type
- `PageContentStep` / `GuideStep` - Step type
- `CreatePageContentInput` / `CreateGuideInput` - Create DTO
- `UpdatePageContentInput` / `UpdateGuideInput` - Update DTO

### SDK (sdk.ts)
```typescript
export class StoreSyncSdk {
  readonly guides: GuidesApi;
  // ... other APIs
}
```

---

## Usage Example

```typescript
import { api } from "@/lib/api";
import {
  useGuidesQuery,
  useGuidesActions,
  GroupFormDialog,
  SortableGroupCard,
} from "./_component";

function GuidesPageInner() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  
  const { data, isLoading } = useGuidesQuery({
    api,
    page,
    limit: 50,
    search,
  });
  
  const { handleSave, handleDelete } = useGuidesActions({
    api,
    groups: data?.data ?? [],
  });
  
  return (
    <>
      {data?.data.map((guide) => (
        <SortableGroupCard
          key={guide.id}
          grp={guide}
          onEdit={(g) => openEditForm(g)}
          onDelete={(g) => confirmDelete(g)}
        />
      ))}
      <GroupFormDialog onSave={handleSave} />
    </>
  );
}
```

---

## Permissions
- Required permission: `page_contents:view` cho read
- API kiểm tra quyền qua `X-User-Id` header

---

## Related Documentation
- [Posts Implementation](./posts-implementation.md)
- [Categories Implementation](./categories-implementation.md)
- [Tags Implementation](./tags-implementation.md)
