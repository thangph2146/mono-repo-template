import 'reflect-metadata';
import { config } from 'dotenv';
import { MikroORM, EntityCaseNamingStrategy } from '@mikro-orm/core';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { SqliteDriver } from '@mikro-orm/sqlite';
import { MySqlDriver } from '@mikro-orm/mysql';
import { PageContent } from './entities/page-content.entity';

config();

function getDriver() {
  const dbUrl = process.env.DATABASE_URL || '';
  if (dbUrl.startsWith('postgres')) return PostgreSqlDriver;
  if (dbUrl.startsWith('sqlite')) return SqliteDriver;
  return MySqlDriver;
}

async function seedGuides() {
  const orm = await MikroORM.init({
    driver: getDriver() as any,
    clientUrl: process.env.DATABASE_URL,
    entities: [PageContent],
    namingStrategy: EntityCaseNamingStrategy,
    debug: false,
  });

  const em = orm.em.fork();
  const PAGE_KEY = 'huong-dan-su-dung';

  // Try to delete existing guides
  try {
    await em.nativeDelete(PageContent, { pageKey: PAGE_KEY });
  } catch {
    // Ignore errors
  }

  const guides = [
    {
      pageKey: PAGE_KEY,
      sectionKey: 'posts-implementation',
      isVisible: true,
      content: {
        title: 'Triển khai Module Bài viết (Posts)',
        description:
          'Hướng dẫn chi tiết về kiến trúc và triển khai module quản lý bài viết, bao gồm cả Backend Admin UI và API service.',
        order: 1,
        steps: [
          {
            order: 1,
            title: 'Cấu trúc thư mục Backend Admin UI',
            description:
              'apps/backend/src/app/posts/ - Trang chính (page.tsx), trang tạo mới (new/page.tsx), trang chi tiết ([id]/page.tsx), trang chỉnh sửa ([id]/edit/page.tsx). Component được tổ chức trong _component/ với các thư mục con: _hooks, _query, _table, _form, _alert-dialog.',
          },
          {
            order: 2,
            title: 'Custom Hooks (_hooks)',
            description:
              'use-post-form.ts - Form validation với Zod schema (title, slug, content, excerpt, image, published, categoryIds, tagIds). use-posts-actions.ts - Xử lý các action (delete, restore, purge, bulk). use-posts-filters.ts - Quản lý column filters và global search.',
          },
          {
            order: 3,
            title: 'React Query Hooks (_query)',
            description:
              'use-posts-queries.ts - usePostsQuery (list với pagination), useTrashQuery (trash), usePostDetailQuery (detail). use-posts-mutations.ts - useDeleteMutation, useRestoreMutation, usePurgeMutation, useBulkMutation. use-taxonomy-queries.ts - useCategoriesQuery, useTagsQuery cho dropdown filters.',
          },
          {
            order: 4,
            title: 'Table Components (_table)',
            description:
              'posts-table.tsx - Bảng hiển thị danh sách với TanStack Table, column filters, row selection. posts-trash-table.tsx - Bảng thùng rác với các action restore/purge. columns.tsx - Định nghĩa các cột với rendering logic và filters.',
          },
          {
            order: 5,
            title: 'Form Components (_form)',
            description:
              'post-form-shell.tsx - Form shell với Lexical editor cho content field. Hỗ trợ upload ảnh, chọn danh mục/tags, toggle published status. Validation với react-hook-form và zodResolver.',
          },
          {
            order: 6,
            title: 'API Service (apps/api/src/posts)',
            description:
              'PostsService với các method: list() (pagination + filters), getById(), create(), update(), softDelete(), restore(), hardDelete(), bulkSetCategories(), bulkClearImages(), bulk(). PostsController mapping các endpoint HTTP.',
          },
          {
            order: 7,
            title: 'Tính năng đặc biệt',
            description:
              'Category tree filtering - tự động bao gồm danh mục con khi lọc theo parent. Two-step query - tránh MySQL "Out of sort memory" error với JOINs phức tạp. Relation filters - resolve tên danh mục/tag sang ID. Bulk operations - delete/restore/hard-delete/set-categories/clear-images.',
          },
        ],
      },
    },
    {
      pageKey: PAGE_KEY,
      sectionKey: 'categories-implementation',
      isVisible: true,
      content: {
        title: 'Triển khai Module Danh mục (Categories)',
        description:
          'Hướng dẫn về module danh mục có cấu trúc cây phân cấp (hierarchical tree), bao gồm UI quản trị và API service.',
        order: 2,
        steps: [
          {
            order: 1,
            title: 'Cấu trúc thư mục Backend Admin UI',
            description:
              'apps/backend/src/app/categories/ - Trang chính (page.tsx), trang tạo mới (new/page.tsx), trang chi tiết ([id]/page.tsx), trang chỉnh sửa ([id]/edit/page.tsx). Component trong _component/ với: _hooks, _query, _table, _form, _alert-dialog.',
          },
          {
            order: 2,
            title: 'Custom Hooks (_hooks)',
            description:
              'use-categories-actions.ts - Xử lý action (delete, restore, purge, bulk set-parent). use-categories-filters.ts - Quản lý column filters và global search. use-category-form.ts - Form validation với Zod schema (name, slug, description, icon, sortOrder, parentId).',
          },
          {
            order: 3,
            title: 'React Query Hooks (_query)',
            description:
              'use-categories-queries.ts - useCategoriesQuery (list với search), useTrashQuery (trash), useCategoryDetailQuery (detail với children + posts), useCategoriesOptionsQuery (tree cho dropdown).',
          },
          {
            order: 4,
            title: 'Table Components (_table)',
            description:
              'categories-table.tsx - Bảng danh sách với tree view, drag-drop reordering. categories-trash-table.tsx - Bảng thùng rác. columns.tsx - Định nghĩa cột với tree expansion logic.',
          },
          {
            order: 5,
            title: 'Tree Building Logic',
            description:
              'buildCategoryTree() trong utils.ts - Maps categories by ID, links children to parents, sorts by name (Vietnamese locale), recursive sorting cho nested children. Client-side tree rendering với expand/collapse.',
          },
          {
            order: 6,
            title: 'API Service (apps/api/src/categories)',
            description:
              'CategoriesService với: list() (pagination + tree post count), getById() (detail với children + posts), create(), update(), softDelete(), restore(), hardDelete(), bulk() (delete/restore/hard-delete/set-parent). collectCategoryDescendantIds() - BFS traversal với safety limits.',
          },
          {
            order: 7,
            title: 'Parent Change Validation',
            description:
              'Ngăn việc set parent chính nó, ngăn tạo cycles trong tree. validateParentIds() - check parent tồn tại và không bị xóa. collectCategoryDescendantIds() - detect potential cycles. Safety: 50 levels max, 10,000 nodes max.',
          },
          {
            order: 8,
            title: 'Post Count Calculation',
            description:
              'countPostsByCategoryTree() - Đếm bài viết trong danh mục và tất cả danh mục con. Used trong list view (parallel execution) và detail view. Optimization: chỉ calculate cho active status.',
          },
        ],
      },
    },
    {
      pageKey: PAGE_KEY,
      sectionKey: 'tags-implementation',
      isVisible: true,
      content: {
        title: 'Triển khai Module Thẻ (Tags)',
        description:
          'Hướng dẫn về module thẻ với cấu trúc phẳng, tree building dựa trên naming convention, và sự khác biệt với categories.',
        order: 3,
        steps: [
          {
            order: 1,
            title: 'Cấu trúc thư mục Backend Admin UI',
            description:
              'apps/backend/src/app/tags/ - Trang chính (page.tsx), trang tạo mới (new/page.tsx), trang chi tiết ([id]/page.tsx), trang chỉnh sửa ([id]/edit/page.tsx). Component trong _component/ với: _hooks, _query, _table, _form, _alert-dialog.',
          },
          {
            order: 2,
            title: 'Custom Hooks (_hooks)',
            description:
              'use-tags-actions.ts - Xử lý action (delete, restore, purge, bulk). use-tags-filters.ts - Quản lý column filters và global search. use-tag-form.ts - Form validation với Zod schema (name, slug).',
          },
          {
            order: 3,
            title: 'React Query Hooks (_query)',
            description:
              'use-tags-queries.ts - useTagsListQuery (all tags, no pagination), useTrashQuery (trash với pagination), useTagDetailQuery (detail với posts).',
          },
          {
            order: 4,
            title: 'Table Components (_table)',
            description:
              'tags-table.tsx - Bảng danh sách với tree view (client-side prefix grouping). tags-trash-table.tsx - Bảng thùng rác. columns.tsx - Định nghĩa cột với tree rendering.',
          },
          {
            order: 5,
            title: 'Client-side Tree Logic',
            description:
              'buildTagTree() trong utils.ts - Groups tags by common prefixes. Ví dụ: "react" becomes parent của "react-hooks", "react-redux". This is purely for UI organization, không có database parent relationship. Group items (isGroup: true) được filter out khỏi bulk operations.',
          },
          {
            order: 6,
            title: 'API Service (apps/api/src/tags)',
            description:
              'TagsService với: list() (pagination + date filters), getById() (detail với posts), create(), update(), softDelete(), restore(), hardDelete(), bulk() (delete/restore/hard-delete). Date filtering supports range queries on deletedAt và updatedAt.',
          },
          {
            order: 7,
            title: 'Sự khác biệt với Categories',
            description:
              'Tags: flat structure vs hierarchical (categories có parent/child), simpler fields (chỉ name/slug), client-side prefix-based tree vs server-side parent relationship, direct post count vs recursive descendant count, no set-parent bulk action, no pagination cho active tags (load all).',
          },
          {
            order: 8,
            title: 'Bulk Operations',
            description:
              'Hỗ trợ delete, restore, hard-delete cho multiple tags. Tất cả operations sử dụng native queries cho performance. Trim và validate IDs trước khi execute. Group items được filter out để tránh lỗi.',
          },
        ],
      },
    },
    {
      pageKey: PAGE_KEY,
      sectionKey: 'guides-page-implementation',
      isVisible: true,
      content: {
        title: 'Triển khai Trang Hướng dẫn (Guides Page)',
        description:
          'Hướng dẫn về trang quản lý hướng dẫn với drag-drop reordering, form editing, và image upload cho các bước hướng dẫn.',
        order: 4,
        steps: [
          {
            order: 1,
            title: 'Cấu trúc thư mục',
            description:
              'apps/backend/src/app/guides/page.tsx - Single page component với đầy đủ chức năng CRUD cho guide groups. Không có thư mục con, tất cả logic nằm trong một file với các sub-components được định nghĩa inline.',
          },
          {
            order: 2,
            title: 'Data Models',
            description:
              'GuideGroup - { id, pageKey, sectionKey, isVisible, content: { title, description, order, steps[] } }. GuideStep - { order, title, description, imageUrl?. }. Content được lưu dưới dạng JSON trong database.',
          },
          {
            order: 3,
            title: 'Drag-Drop Reordering',
            description:
              'Sử dụng @dnd-kit/core và @dnd-kit/sortable. DndContext với closestCenter collision detection. SortableContext với rectSortingStrategy. useSortable hook cho từng card. arrayMove để reorder local state, sau đó gọi API để lưu thứ tự mới.',
          },
          {
            order: 4,
            title: 'Form Components',
            description:
              'GroupFormDialog - Modal dialog để tạo/sửa guide group. ImageUploadField - Upload ảnh qua /admin/uploads endpoint với folderPath="guides". StepEditor - Component để quản lý danh sách steps với drag-drop vertical ordering.',
          },
          {
            order: 5,
            title: 'State Management',
            description:
              'Local state: search, page, formOpen, editTarget, deleteTarget, expandedId, localGroups. isReorderingRef ref để tránh sync từ server trong khi drag-drop. React Query cho data fetching và mutations (create, update, delete, reorder).',
          },
          {
            order: 6,
            title: 'UI Components từ @ui',
            description:
              'Button, Input, Label, Textarea, Badge, Switch, Skeleton cho form elements. Card, CardContent, CardHeader, CardTitle, CardDescription cho guide group cards. Dialog cho form modal. AlertDialog cho confirm delete. ScrollArea cho scrollable content trong dialog.',
          },
          {
            order: 7,
            title: 'SortableGroupCard Component',
            description:
              'Card component được wrap với useSortable. Hiển thị title, sectionKey, visibility badge (Eye/EyeOff), description. Expand/collapse để xem steps. Buttons cho Edit và Delete. Transform và transition animations từ @dnd-kit/utilities.',
          },
          {
            order: 8,
            title: 'API Integration',
            description:
              'GET /admin/page-contents?search=huong-dan-su-dung - Fetch guide groups. POST /admin/page-contents - Create new group. PUT /admin/page-contents/:id - Update group. DELETE /admin/page-contents/:id - Delete group. Auth headers từ readAdminSession().',
          },
          {
            order: 9,
            title: 'Permissions',
            description:
              'AdminPageGuard với permission="page_contents:view". Kiểm tra quyền truy cập trước khi render page. User ID từ session được gửi qua X-User-Id header cho tất cả API calls.',
          },
          {
            order: 10,
            title: 'UX Features',
            description:
              'Drag-drop để reorder guide groups. Search filter theo sectionKey hoặc title. Pagination cho large datasets. Expand/collapse steps preview. Visibility toggle (public/hidden). Bulk operations không có, chỉ single delete. Toast notifications cho success/error.',
          },
        ],
      },
    },
  ];

  for (const guide of guides) {
    const entity = new PageContent();
    entity.pageKey = guide.pageKey;
    entity.sectionKey = guide.sectionKey;
    entity.isVisible = guide.isVisible;
    entity.content = guide.content as Record<string, unknown>;
    em.persist(entity);
  }

  await em.flush();
  console.log(`✓ Seeded ${guides.length} guide groups for page: ${PAGE_KEY}`);

  await orm.close();
}

seedGuides().catch((err) => {
  console.error('Error seeding guides:', err);
  process.exit(1);
});
