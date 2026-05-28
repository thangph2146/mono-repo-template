# Hub admin — @backend — tóm tắt cho AI (Graphify)

> Tự động sinh từ `../snapshot/context.json` — **đọc file này trước**; tránh mở toàn bộ JSON snapshot (nhúng source đầy đủ).

- **projectRoot:** `D:/HUB/working/2026/hub-parrent-template/apps/backend`
- **context.generatedAt:** 2026-05-28T07:09:41.317Z

## Mục lục artefact Graphify

- **Markdown (ưu tiên đọc):** file này — [`FOLDER_TREE.md`](FOLDER_TREE.md), [`GRAPH_STATS.md`](GRAPH_STATS.md)
- **Snapshot (JSON nặng):** [`../snapshot/context.json`](../snapshot/context.json), [`../snapshot/graph.json`](../snapshot/graph.json) — chỉ mở khi cần trích source hoặc đồ thị đầy đủ.
- **Quy ước thư mục `.graphify` (tay):** [`../README.md`](../README.md).

## Liên kết dịch vụ & tài liệu hub

App **không** import chéo source `apps/*`; giao tiếp qua **HTTP** + `@workspace/api-client` (và `fetch` public ở storefront khi cần).

### Graphify — markdown các phần còn lại của monorepo

- **@frontend:** [SUMMARY](../../../../apps/frontend/.graphify/markdown/SUMMARY_FOR_AI.md) · [FOLDER_TREE](../../../../apps/frontend/.graphify/markdown/FOLDER_TREE.md) · [GRAPH_STATS](../../../../apps/frontend/.graphify/markdown/GRAPH_STATS.md)
- **@api:** [SUMMARY](../../../../apps/api/.graphify/markdown/SUMMARY_FOR_AI.md) · [FOLDER_TREE](../../../../apps/api/.graphify/markdown/FOLDER_TREE.md) · [GRAPH_STATS](../../../../apps/api/.graphify/markdown/GRAPH_STATS.md)
- **packages:** [SUMMARY](../../../../packages/.graphify/markdown/SUMMARY_FOR_AI.md) · [WORKSPACE_DEPS](../../../../packages/.graphify/markdown/WORKSPACE_DEPS.md)
- **monorepo (chỉ mục + chủ đề):** [SUMMARY gốc](../../../../.graphify/markdown/SUMMARY_FOR_AI.md)

### Tài liệu hub (không sinh bởi Graphify)

- [MICROSERVICE_SYSTEM_MAP](../../../../docs/hub-parent/MICROSERVICE_SYSTEM_MAP.md) — boundaries, ORM, checklist.
- [AGENTS_GUIDE](../../../../docs/hub-parent/AGENTS_GUIDE.md) — thứ tự đọc cho agent.
- [AGENTS.md](../../../../AGENTS.md) — `pnpm check`, `check:full`.

## Bản đồ từ snapshot/graph.json

- **Cây thư mục `src/`:** [`FOLDER_TREE.md`](FOLDER_TREE.md) (ASCII từ `../snapshot/graph.json`).
- **Thống kê graph:** [`GRAPH_STATS.md`](GRAPH_STATS.md) — quy mô node/link, top file in/out-degree (điểm nóng import).

## Thống kê
- **totalFiles:** 320
- **clientComponents:** 147

## Trang (pages) (61)
- `src/app/academic-years/new/page.tsx`
- `src/app/academic-years/page.tsx`
- `src/app/academic-years/[id]/edit/page.tsx`
- `src/app/academic-years/[id]/page.tsx`
- `src/app/categories/new/page.tsx`
- `src/app/categories/page.tsx`
- `src/app/categories/[id]/edit/page.tsx`
- `src/app/categories/[id]/page.tsx`
- `src/app/contact-requests/page.tsx`
- `src/app/contact-requests/[id]/edit/page.tsx`
- `src/app/contact-requests/[id]/page.tsx`
- `src/app/courses/new/page.tsx`
- `src/app/courses/page.tsx`
- `src/app/courses/[id]/edit/page.tsx`
- `src/app/courses/[id]/page.tsx`
- `src/app/data/page.tsx`
- `src/app/database-schema/page.tsx`
- `src/app/graph/page.tsx`
- `src/app/guides/new/page.tsx`
- `src/app/guides/page.tsx`
- `src/app/guides/[id]/edit/page.tsx`
- `src/app/guides/[id]/page.tsx`
- `src/app/locations/new/page.tsx`
- `src/app/locations/page.tsx`
- `src/app/locations/[id]/edit/page.tsx`
- `src/app/locations/[id]/page.tsx`
- `src/app/login/page.tsx`
- `src/app/majors/new/page.tsx`
- `src/app/majors/page.tsx`
- `src/app/majors/[id]/edit/page.tsx`
- `src/app/majors/[id]/page.tsx`
- `src/app/my-students/page.tsx`
- `src/app/page.tsx`
- `src/app/parent-students/page.tsx`
- `src/app/posts/new/page.tsx`
- `src/app/posts/page.tsx`
- `src/app/posts/[id]/edit/page.tsx`
- `src/app/posts/[id]/page.tsx`
- `src/app/profile/page.tsx`
- `src/app/rbac/page.tsx`
- `src/app/register/page.tsx`
- `src/app/speakers/new/page.tsx`
- `src/app/speakers/page.tsx`
- `src/app/speakers/[id]/edit/page.tsx`
- `src/app/speakers/[id]/page.tsx`
- `src/app/staff/new/page.tsx`
- `src/app/staff/page.tsx`
- `src/app/staff/[id]/edit/page.tsx`
- `src/app/staff/[id]/page.tsx`
- `src/app/tags/new/page.tsx`
- `src/app/tags/page.tsx`
- `src/app/tags/[id]/edit/page.tsx`
- `src/app/tags/[id]/page.tsx`
- `src/app/training-levels/new/page.tsx`
- `src/app/training-levels/page.tsx`
- `src/app/training-levels/[id]/edit/page.tsx`
- `src/app/training-levels/[id]/page.tsx`
- `src/app/training-systems/new/page.tsx`
- `src/app/training-systems/page.tsx`
- `src/app/training-systems/[id]/edit/page.tsx`
- `src/app/training-systems/[id]/page.tsx`

## Layout (1)
- `src/app/layout.tsx`

## API routes (1)
- `src/app/api/graphify/route.ts`

## Góc hệ thống (@backend) — đường dẫn gợi ý

- **Root layout:** `src/app/layout.tsx`
- **Route handlers dưới `src/app/api/`:** 1 file (danh sách `apiRoutes` ở trên nếu có).

## Module map (không có nội dung file)

| File | Loại | Client | Exports | Imports |
|------|------|--------|---------|---------|
| `components.json` | config | — | — | — |
| `next.config.ts` | config | — | — | — |
| `package.json` | config | — | — | — |
| `src/app/academic-years/[id]/edit/page.tsx` | page | yes | EditAcademicYearPage | src/components/admin-page-guard.tsx, src/lib/api.ts, src/app/academic-years/_component |
| `src/app/academic-years/[id]/page.tsx` | page | yes | AcademicYearDetailPage | src/components/admin-page-guard.tsx, src/lib/api.ts, src/app/academic-years/_component |
| `src/app/academic-years/_component/_alert-dialog/academic-years-confirm-dialog.tsx` | tsx | yes | AcademicYearsConfirmDialogProps, AcademicYearsConfirmDialog | src/components/admin-confirm-action-dialog.tsx, src/app/academic-years/_component/types.ts |
| `src/app/academic-years/_component/_alert-dialog/index.ts` | ts | no | AcademicYearsConfirmDialog | src/app/academic-years/_component/_alert-dialog/academic-years-confirm-dialog.tsx |
| `src/app/academic-years/_component/_form/academic-year-form-shell.tsx` | tsx | yes | AcademicYearFormShellProps, AcademicYearFormShell | src/app/academic-years/_component/types.ts |
| `src/app/academic-years/_component/_form/index.ts` | ts | no | AcademicYearFormShell | src/app/academic-years/_component/_form/academic-year-form-shell.tsx |
| `src/app/academic-years/_component/_hooks/index.ts` | ts | no | useColumnFiltersChange, useClearListFilters, useClearTrashFilters, buildAcademicYearPayload, useAcademicYearForm, useHandleConfirmAction, useConfirmAction | src/hooks/use-table-filters.ts, src/app/academic-years/_component/_hooks/use-academic-years-actions.ts |
| `src/app/academic-years/_component/_hooks/use-academic-years-actions.ts` | ts | no | buildAcademicYearPayload, useAcademicYearForm, useHandleConfirmAction, useConfirmAction | src/app/academic-years/_component/types.ts |
| `src/app/academic-years/_component/_query/index.ts` | ts | no | useAcademicYearDetailQuery, useAcademicYearsListQuery, UseTrashQueryProps, useAcademicYearsTrashQuery | src/app/academic-years/_component/types.ts |
| `src/app/academic-years/_component/_table/academic-years-table.tsx` | tsx | yes | AcademicYearsTableProps, AcademicYearsTable | src/components/admin-data-table, src/app/academic-years/_component/types.ts |
| `src/app/academic-years/_component/_table/academic-years-trash-table.tsx` | tsx | yes | AcademicYearsTrashTableProps, AcademicYearsTrashTable | src/components/admin-data-table, src/components/admin-table-pagination-footer.tsx, src/app/academic-years/_component/types.ts |
| `src/app/academic-years/_component/_table/index.ts` | ts | no | AcademicYearsTable, AcademicYearsTrashTable | src/app/academic-years/_component/_table/academic-years-table.tsx, src/app/academic-years/_component/_table/academic-years-trash-table.tsx |
| `src/app/academic-years/_component/columns.tsx` | tsx | yes | getAcademicYearColumns, getTrashColumns | src/app/academic-years/_component/types.ts |
| `src/app/academic-years/_component/index.ts` | ts | no | academicYearFormSchema, getAcademicYearColumns, getTrashColumns, useAcademicYearDetailQuery, useAcademicYearsListQuery, useAcademicYearsTrashQuery, useColumnFiltersChange, useClearListFilters, useClea | src/app/academic-years/_component/types.ts, src/app/academic-years/_component/columns.tsx, src/app/academic-years/_component/_query, src/app/academic-years/_component/_hooks, src/app/academic-years/_c |
| `src/app/academic-years/_component/types.ts` | ts | no | AcademicYearRow, AcademicYearConfirmAction, academicYearFormSchema, AcademicYearFormValues, AcademicYearDetail |  |
| `src/app/academic-years/new/page.tsx` | page | yes | NewAcademicYearPage | src/components/admin-page-guard.tsx, src/lib/api.ts, src/app/academic-years/_component |
| `src/app/academic-years/page.tsx` | page | yes | AcademicYearsPage | src/hooks/use-debounced-value.ts, src/providers/auth-provider.tsx, src/components/admin-page-guard.tsx, src/lib/api.ts, src/app/academic-years/_component |
| `src/app/api/graphify/route.ts` | api-route | no |  |  |
| `src/app/categories/[id]/edit/page.tsx` | page | yes | EditCategoryPage | src/components/admin-page-guard.tsx, src/lib/api.ts, src/app/categories/_component |
| `src/app/categories/[id]/page.tsx` | page | yes | CategoryDetailPage | src/components/admin-page-guard.tsx, src/lib/api.ts, src/app/categories/_component |
| `src/app/categories/_component/_alert-dialog/categories-confirm-dialog.tsx` | tsx | yes | CategoriesConfirmDialogProps, CategoriesConfirmDialog | src/components/admin-confirm-action-dialog.tsx, src/app/categories/_component/types.ts |
| `src/app/categories/_component/_alert-dialog/index.ts` | ts | no | CategoriesConfirmDialog | src/app/categories/_component/_alert-dialog/categories-confirm-dialog.tsx |
| `src/app/categories/_component/_form/category-form-shell.tsx` | tsx | yes | CategoryFormShellProps, CategoryFormShell | src/app/categories/_component/types.ts, src/lib/category-icons.ts, src/app/categories/_component/_hooks |
| `src/app/categories/_component/_form/index.ts` | ts | no | CategoryFormShell | src/app/categories/_component/_form/category-form-shell.tsx |
| `src/app/categories/_component/_hooks/index.ts` | ts | no | useColumnFiltersChange, useClearListFilters, useClearTrashFilters, useHandleConfirmAction, useCategoryForm, useConfirmAction, buildCategoryPayload, categoryFormSchema | src/hooks/use-table-filters.ts, src/app/categories/_component/_hooks/use-categories-actions.ts |
| `src/app/categories/_component/_hooks/use-categories-actions.ts` | ts | no | buildCategoryPayload, categoryFormSchema, CategoryFormValues, useCategoryForm, useHandleConfirmAction, useConfirmAction | src/app/categories/_component/types.ts |
| `src/app/categories/_component/_hooks/use-categories-filters.ts` | ts | no | useColumnFiltersChange, useClearListFilters, useClearTrashFilters |  |
| `src/app/categories/_component/_query/index.ts` | ts | no | useCategoryDetailQuery, UseCategoriesQueryProps, useCategoriesQuery, UseTrashQueryProps, useTrashQuery, useCategoriesOptionsQuery | src/app/categories/_component/types.ts |
| `src/app/categories/_component/_table/categories-table.tsx` | tsx | yes | CategoriesTableProps, CategoriesTable | src/components/admin-data-table, src/app/categories/_component/types.ts |
| `src/app/categories/_component/_table/categories-trash-table.tsx` | tsx | yes | CategoriesTrashTableProps, CategoriesTrashTable | src/components/admin-data-table, src/components/admin-table-pagination-footer.tsx, src/app/categories/_component/types.ts |
| `src/app/categories/_component/_table/index.ts` | ts | no | CategoriesTable, CategoriesTrashTable | src/app/categories/_component/_table/categories-table.tsx, src/app/categories/_component/_table/categories-trash-table.tsx |
| `src/app/categories/_component/columns.tsx` | tsx | yes | getCategoryColumns, getTrashColumns | src/app/categories/_component/types.ts |
| `src/app/categories/_component/index.ts` | ts | no | getCategoryColumns, getTrashColumns, slugify, buildCategoryOptionTree, unwrapEnvelope, normalizePaged, buildCategoriesFilterQuery, formatDateTime, useColumnFiltersChange, useClearListFilters, useClear | src/app/categories/_component/columns.tsx, src/app/categories/_component/utils.ts, src/app/categories/_component/_hooks, src/app/categories/_component/_table, src/app/categories/_component/_alert-dial |
| `src/app/categories/_component/types.ts` | ts | no | CategoryRow, CategoryTreeOption, CategoryConfirmAction, FormState, CategoryDetail |  |
| `src/app/categories/_component/utils.ts` | ts | no | buildCategoriesFilterQuery, slugify, formatDateTime, buildCategoryOptionTree, unwrapEnvelope, normalizePaged | src/lib |
| `src/app/categories/new/page.tsx` | page | yes | NewCategoryPage | src/components/admin-page-guard.tsx, src/lib/api.ts, src/app/categories/_component |
| `src/app/categories/page.tsx` | page | yes | CategoriesPage | src/hooks/use-debounced-value.ts, src/providers/auth-provider.tsx, src/components/admin-page-guard.tsx, src/lib/api.ts, src/app/categories/_component, src/app/categories/_component/types.ts |
| `src/app/contact-requests/[id]/edit/page.tsx` | page | yes | EditContactRequestPage | src/app/contact-requests/_component/_hooks/use-contact-form.ts, src/app/contact-requests/_component/_form/contact-form-shell.tsx, src/hooks/queries.ts, src/app/contact-requests/_component/_query/use-c |
| `src/app/contact-requests/[id]/page.tsx` | page | yes | ContactRequestDetailPage | src/hooks/queries.ts, src/components/admin-page-guard.tsx, src/app/contact-requests/_component/types.ts, src/app/contact-requests/_component/utils.ts |
| `src/app/contact-requests/_component/_alert-dialog/contact-confirm-dialog.tsx` | tsx | no | ContactConfirmDialog, ContactBulkConfirmDialog | src/components/admin-confirm-action-dialog.tsx, src/app/contact-requests/_component/types.ts |
| `src/app/contact-requests/_component/_alert-dialog/index.ts` | ts | no |  | src/app/contact-requests/_component/_alert-dialog/contact-confirm-dialog.tsx |
| `src/app/contact-requests/_component/_form/contact-form-shell.tsx` | tsx | no | ContactFormShell | src/app/contact-requests/_component/_hooks/use-contact-form.ts |
| `src/app/contact-requests/_component/_form/index.ts` | ts | no |  | src/app/contact-requests/_component/_form/contact-form-shell.tsx |
| `src/app/contact-requests/_component/_hooks/index.ts` | ts | no |  | src/app/contact-requests/_component/_hooks/use-contact-form.ts |
| `src/app/contact-requests/_component/_hooks/use-contact-form.ts` | ts | no | contactFormSchema, ContactFormData, useContactForm |  |
| `src/app/contact-requests/_component/_query/index.ts` | ts | no |  | src/app/contact-requests/_component/_query/use-contact-queries.ts |
| `src/app/contact-requests/_component/_query/use-contact-queries.ts` | ts | yes | useCreateContactRequest, useUpdateContactRequest, useDeleteContactRequest, useRestoreContactRequest, usePurgeContactRequest, useBulkDeleteContactRequest, useBulkRestoreContactRequest, useBulkPurgeCont | src/lib/api.ts |
| `src/app/contact-requests/_component/_table/contact-table.tsx` | tsx | no | ContactRequestTable | src/components/admin-data-table, src/components/admin-table-pagination-footer.tsx, src/app/contact-requests/_component/columns.tsx, src/app/contact-requests/_component/types.ts, src/lib/export-csv.ts, |
| `src/app/contact-requests/_component/_table/contact-trash-table.tsx` | tsx | no | ContactRequestTrashTable | src/components/admin-data-table, src/components/admin-table-pagination-footer.tsx, src/app/contact-requests/_component/columns.tsx, src/app/contact-requests/_component/types.ts, src/lib/export-csv.ts, |
| `src/app/contact-requests/_component/_table/index.ts` | ts | no |  | src/app/contact-requests/_component/_table/contact-table.tsx, src/app/contact-requests/_component/_table/contact-trash-table.tsx |
| `src/app/contact-requests/_component/columns.tsx` | tsx | yes | ContactRequestColumnsProps, getContactRequestColumns, getTrashColumns | src/app/contact-requests/_component/types.ts, src/app/contact-requests/_component/utils.ts |
| `src/app/contact-requests/_component/index.ts` | ts | no |  | src/app/contact-requests/_component/types.ts, src/app/contact-requests/_component/utils.ts, src/app/contact-requests/_component/columns.tsx, src/app/contact-requests/_component/_hooks, src/app/contact |
| `src/app/contact-requests/_component/types.ts` | ts | no | CONTACT_REQUEST_STATUSES, CONTACT_REQUEST_STATUS_LABELS |  |
| `src/app/contact-requests/_component/utils.ts` | ts | no | formatPhoneNumber, buildFilterQuery |  |
| `src/app/contact-requests/page.tsx` | page | yes | ContactRequestsPage | src/components/admin-page-guard.tsx, src/hooks/queries.ts, src/lib/build-admin-filter-query.ts, src/hooks/use-debounced-value.ts, src/app/contact-requests/_component, src/app/contact-requests/_compone |
| `src/app/courses/[id]/edit/page.tsx` | page | yes | EditCoursePage | src/components/admin-page-guard.tsx, src/lib/api.ts, src/app/courses/_component |
| `src/app/courses/[id]/page.tsx` | page | yes | CourseDetailPage | src/components/admin-page-guard.tsx, src/lib/api.ts, src/app/courses/_component |
| `src/app/courses/_component/_alert-dialog/courses-confirm-dialog.tsx` | tsx | yes | CoursesConfirmDialogProps, CoursesConfirmDialog | src/components/admin-confirm-action-dialog.tsx, src/app/courses/_component/types.ts |
| `src/app/courses/_component/_alert-dialog/index.ts` | ts | no | CoursesConfirmDialog | src/app/courses/_component/_alert-dialog/courses-confirm-dialog.tsx |
| `src/app/courses/_component/_form/courses-form-shell.tsx` | tsx | yes | CourseFormShellProps, CourseFormShell | src/app/courses/_component/types.ts |
| `src/app/courses/_component/_form/index.ts` | ts | no | CourseFormShell | src/app/courses/_component/_form/courses-form-shell.tsx |
| `src/app/courses/_component/_hooks/index.ts` | ts | no | useColumnFiltersChange, useClearListFilters, useClearTrashFilters, buildCoursePayload, useCourseForm, useHandleConfirmAction, useConfirmAction | src/hooks/use-table-filters.ts, src/app/courses/_component/_hooks/use-courses-actions.ts |
| `src/app/courses/_component/_hooks/use-courses-actions.ts` | ts | no | buildCoursePayload, useCourseForm, useHandleConfirmAction, useConfirmAction | src/app/courses/_component/types.ts |
| `src/app/courses/_component/_query/index.ts` | ts | no | useCourseDetailQuery, useCoursesListQuery, useCoursesTrashQuery | src/app/courses/_component/_query/use-courses-queries.ts |
| `src/app/courses/_component/_query/use-courses-queries.ts` | ts | no | useCourseDetailQuery, useCoursesListQuery, UseTrashQueryProps, useCoursesTrashQuery | src/app/courses/_component/types.ts |
| `src/app/courses/_component/_table/courses-table.tsx` | tsx | yes | CoursesTableProps, CoursesTable | src/components/admin-data-table, src/app/courses/_component/types.ts |
| `src/app/courses/_component/_table/courses-trash-table.tsx` | tsx | yes | CoursesTrashTableProps, CoursesTrashTable | src/components/admin-data-table, src/components/admin-table-pagination-footer.tsx, src/app/courses/_component/types.ts |
| `src/app/courses/_component/_table/index.ts` | ts | no | CoursesTable, CoursesTrashTable | src/app/courses/_component/_table/courses-table.tsx, src/app/courses/_component/_table/courses-trash-table.tsx |
| `src/app/courses/_component/columns.tsx` | tsx | yes | getCourseColumns, getTrashColumns | src/app/courses/_component/types.ts |
| `src/app/courses/_component/index.ts` | ts | no | courseFormSchema, getCourseColumns, getTrashColumns, useCourseDetailQuery, useCoursesListQuery, useCoursesTrashQuery, useColumnFiltersChange, useClearListFilters, useClearTrashFilters, buildCoursePayl | src/app/courses/_component/types.ts, src/app/courses/_component/columns.tsx, src/app/courses/_component/_query, src/app/courses/_component/_hooks, src/app/courses/_component/_form, src/app/courses/_co |
| `src/app/courses/_component/types.ts` | ts | no | CourseRow, CourseConfirmAction, courseFormSchema, CourseFormValues, CourseDetail |  |
| `src/app/courses/new/page.tsx` | page | yes | NewCoursePage | src/components/admin-page-guard.tsx, src/lib/api.ts, src/app/courses/_component |
| `src/app/courses/page.tsx` | page | yes | CoursesPage | src/hooks/use-debounced-value.ts, src/providers/auth-provider.tsx, src/components/admin-page-guard.tsx, src/lib/api.ts, src/app/courses/_component |
| `src/app/data/page.tsx` | page | yes | DataBackupPage | src/lib/auth-session.ts, src/components/admin-page-guard.tsx |
| `src/app/database-schema/page.tsx` | page | yes | DatabaseSchemaPage | src/components/admin-page-guard.tsx, src/lib/api.ts |
| `src/app/graph/page.tsx` | page | yes | GraphPage | src/components/admin-page-guard.tsx |
| `src/app/guides/[id]/edit/page.tsx` | page | yes | EditGuidePage | src/components/admin-page-guard.tsx, src/lib/api.ts, src/app/guides/_component |
| `src/app/guides/[id]/page.tsx` | page | yes | GuideDetailPage | src/components/admin-page-guard.tsx, src/lib/api.ts, src/app/guides/_component |
| `src/app/guides/_component/_alert-dialog/guides-confirm-dialog.tsx` | tsx | yes | GuidesConfirmDialogProps, GuidesConfirmDialog | src/components/admin-confirm-action-dialog.tsx, src/app/guides/_component/types.ts |
| `src/app/guides/_component/_alert-dialog/index.ts` | ts | no | GuidesConfirmDialog | src/app/guides/_component/_alert-dialog/guides-confirm-dialog.tsx |
| `src/app/guides/_component/_form/guide-form-shell.tsx` | tsx | yes | GuideFormShellProps, GuideFormShell | src/app/guides/_component/_form/step-editor.tsx, src/app/guides/_component/types.ts |
| `src/app/guides/_component/_form/image-upload-field.tsx` | tsx | yes | ImageUploadField | src/app/guides/_component/utils.ts |
| `src/app/guides/_component/_form/index.ts` | ts | no | GuideFormShell, StepEditor, ImageUploadField | src/app/guides/_component/_form/guide-form-shell.tsx, src/app/guides/_component/_form/step-editor.tsx, src/app/guides/_component/_form/image-upload-field.tsx |
| `src/app/guides/_component/_form/step-editor.tsx` | tsx | yes | StepEditor | src/app/guides/_component/_form/image-upload-field.tsx, src/app/guides/_component/types.ts |
| `src/app/guides/_component/_hooks/index.ts` | ts | no | useGuidesActions, useGuideForm, buildGuidePayload, guideFormSchema | src/app/guides/_component/_hooks/use-guides-actions.ts, src/app/guides/_component/_hooks/use-guide-form.ts |
| `src/app/guides/_component/_hooks/use-guide-form.ts` | ts | no | guideFormSchema, GuideFormValues, useGuideForm, buildGuidePayload | src/app/guides/_component/types.ts |
| `src/app/guides/_component/_hooks/use-guides-actions.ts` | ts | yes | useGuidesActions | src/app/guides/_component/types.ts, src/app/guides/_component/_query |
| `src/app/guides/_component/_query/index.ts` | ts | no | useGuidesQuery, useGuideDetailQuery, useCreateGuideMutation, useUpdateGuideMutation, useDeleteGuideMutation, useReorderGuidesMutation | src/app/guides/_component/_query/use-guides-queries.ts, src/app/guides/_component/_query/use-guides-mutations.ts |
| `src/app/guides/_component/_query/use-guides-mutations.ts` | ts | yes | useCreateGuideMutation, useUpdateGuideMutation, useDeleteGuideMutation, useReorderGuidesMutation | src/app/guides/_component/types.ts, src/app/guides/_component/utils.ts |
| `src/app/guides/_component/_query/use-guides-queries.ts` | ts | yes | UseGuidesQueryProps, useGuidesQuery, useGuideDetailQuery | src/app/guides/_component/types.ts, src/app/guides/_component/utils.ts |
| `src/app/guides/_component/_table/guides-table.tsx` | tsx | yes | GuidesTableProps, GuidesTable | src/components/admin-data-table, src/app/guides/_component/types.ts |
| `src/app/guides/_component/_table/index.ts` | ts | no | GuidesTable | src/app/guides/_component/_table/guides-table.tsx |
| `src/app/guides/_component/columns.tsx` | tsx | yes | GuideColumnsProps, getGuidesColumns | src/app/guides/_component/types.ts, src/app/guides/_component/utils.ts |
| `src/app/guides/_component/index.ts` | ts | no | PAGE_KEY, parseContent, apiBase, authHeaders, uploadImage, sortGroupsByOrder, reorderSteps, useGuidesActions, useGuideForm, buildGuidePayload, guideFormSchema, useGuidesQuery, useGuideDetailQuery, use | src/app/guides/_component/types.ts, src/app/guides/_component/utils.ts, src/app/guides/_component/_hooks, src/app/guides/_component/_query, src/app/guides/_component/_form, src/app/guides/_component/_ |
| `src/app/guides/_component/types.ts` | ts | no | GuideStep, GuideGroup, CreateGuideInput, UpdateGuideInput, ListResult, GuideFormData, UpdateGuideData, GuideConfirmAction |  |
| `src/app/guides/_component/utils.ts` | ts | no | PAGE_KEY, parseContent, apiBase, authHeaders, sortGroupsByOrder, reorderSteps | src/lib/auth-session.ts, src/app/guides/_component/types.ts |
| `src/app/guides/new/page.tsx` | page | yes | NewGuidePage | src/components/admin-page-guard.tsx, src/lib/api.ts, src/app/guides/_component |
| `src/app/guides/page.tsx` | page | yes | GuidesPage | src/components/admin-page-guard.tsx, src/lib/api.ts, src/app/guides/_component |
| `src/app/layout.tsx` | layout | no | metadata, RootLayout | src/app/page.tsx, src/providers/query-provider.tsx, src/providers/auth-provider.tsx, src/components/admin-shell.tsx |
| `src/app/loading.tsx` | loading | no | Loading |  |
| `src/app/locations/[id]/edit/page.tsx` | page | yes | EditLocationPage | src/components/admin-page-guard.tsx, src/lib/api.ts, src/app/locations/_component |
| `src/app/locations/[id]/page.tsx` | page | yes | LocationDetailPage | src/components/admin-page-guard.tsx, src/lib/api.ts, src/app/locations/_component |
| `src/app/locations/_component/_alert-dialog/index.ts` | ts | no | LocationsConfirmDialog | src/app/locations/_component/_alert-dialog/locations-confirm-dialog.tsx |
| `src/app/locations/_component/_alert-dialog/locations-confirm-dialog.tsx` | tsx | yes | LocationsConfirmDialogProps, LocationsConfirmDialog | src/components/admin-confirm-action-dialog.tsx, src/app/locations/_component/types.ts |
| `src/app/locations/_component/_form/index.ts` | ts | no | LocationFormShell | src/app/locations/_component/_form/location-form-shell.tsx |
| `src/app/locations/_component/_form/location-form-shell.tsx` | tsx | yes | LocationFormShellProps, LocationFormShell | src/app/locations/_component/types.ts |
| `src/app/locations/_component/_hooks/index.ts` | ts | no | useColumnFiltersChange, useClearListFilters, useClearTrashFilters, buildLocationPayload, useLocationForm, useHandleConfirmAction, useConfirmAction | src/hooks/use-table-filters.ts, src/app/locations/_component/_hooks/use-locations-actions.ts |
| `src/app/locations/_component/_hooks/use-locations-actions.ts` | ts | no | buildLocationPayload, useLocationForm, useHandleConfirmAction, useConfirmAction | src/app/locations/_component/types.ts |
| `src/app/locations/_component/_query/index.ts` | ts | no | useLocationDetailQuery, useLocationsListQuery, useLocationsTrashQuery | src/app/locations/_component/_query/use-locations-queries.ts |
| `src/app/locations/_component/_query/use-locations-queries.ts` | ts | no | useLocationDetailQuery, useLocationsListQuery, UseTrashQueryProps, useLocationsTrashQuery | src/app/locations/_component/types.ts |
| `src/app/locations/_component/_table/index.ts` | ts | no | LocationsTable, LocationsTrashTable | src/app/locations/_component/_table/locations-table.tsx, src/app/locations/_component/_table/locations-trash-table.tsx |
| `src/app/locations/_component/_table/locations-table.tsx` | tsx | yes | LocationsTableProps, LocationsTable | src/components/admin-data-table, src/app/locations/_component/types.ts |
| `src/app/locations/_component/_table/locations-trash-table.tsx` | tsx | yes | LocationsTrashTableProps, LocationsTrashTable | src/components/admin-data-table, src/components/admin-table-pagination-footer.tsx, src/app/locations/_component/types.ts |
| `src/app/locations/_component/columns.tsx` | tsx | yes | getLocationColumns, getTrashColumns | src/app/locations/_component/types.ts |
| `src/app/locations/_component/index.ts` | ts | no | locationFormSchema, getLocationColumns, getTrashColumns, useLocationDetailQuery, useLocationsListQuery, useLocationsTrashQuery, useColumnFiltersChange, useClearListFilters, useClearTrashFilters, build | src/app/locations/_component/types.ts, src/app/locations/_component/columns.tsx, src/app/locations/_component/_query, src/app/locations/_component/_hooks, src/app/locations/_component/_form, src/app/l |
| `src/app/locations/_component/types.ts` | ts | no | LocationRow, LocationConfirmAction, locationFormSchema, LocationFormValues, LocationDetail |  |
| `src/app/locations/new/page.tsx` | page | yes | NewLocationPage | src/components/admin-page-guard.tsx, src/lib/api.ts, src/app/locations/_component |
| `src/app/locations/page.tsx` | page | yes | LocationsPage | src/hooks/use-debounced-value.ts, src/providers/auth-provider.tsx, src/components/admin-page-guard.tsx, src/lib/api.ts, src/app/locations/_component |
| `src/app/login/page.tsx` | page | no | AdminLoginPage | src/features/auth/sign-in-form.tsx |
| `src/app/majors/[id]/edit/page.tsx` | page | yes | EditMajorPage | src/components/admin-page-guard.tsx, src/lib/api.ts, src/app/majors/_component |
| `src/app/majors/[id]/page.tsx` | page | yes | MajorDetailPage | src/components/admin-page-guard.tsx, src/lib/api.ts, src/app/majors/_component |
| `src/app/majors/_component/_alert-dialog/index.ts` | ts | no | MajorsConfirmDialog | src/app/majors/_component/_alert-dialog/majors-confirm-dialog.tsx |
| `src/app/majors/_component/_alert-dialog/majors-confirm-dialog.tsx` | tsx | yes | MajorsConfirmDialogProps, MajorsConfirmDialog | src/components/admin-confirm-action-dialog.tsx, src/app/majors/_component/types.ts |
| `src/app/majors/_component/_form/index.ts` | ts | no | MajorsFormShell | src/app/majors/_component/_form/majors-form-shell.tsx |
| `src/app/majors/_component/_form/majors-form-shell.tsx` | tsx | yes | MajorsFormShellProps, MajorsFormShell | src/app/majors/_component/types.ts |
| `src/app/majors/_component/_hooks/index.ts` | ts | no | useColumnFiltersChange, useClearListFilters, useClearTrashFilters, buildMajorPayload, useMajorForm, useHandleConfirmAction, useConfirmAction | src/hooks/use-table-filters.ts, src/app/majors/_component/_hooks/use-majors-actions.ts |
| `src/app/majors/_component/_hooks/use-majors-actions.ts` | ts | no | buildMajorPayload, useMajorForm, useHandleConfirmAction, useConfirmAction | src/app/majors/_component/types.ts |
| `src/app/majors/_component/_query/index.ts` | ts | no | useMajorDetailQuery, useMajorsListQuery, UseTrashQueryProps, useMajorsTrashQuery | src/app/majors/_component/types.ts |
| `src/app/majors/_component/_table/index.ts` | ts | no | MajorsTable, MajorsTrashTable | src/app/majors/_component/_table/majors-table.tsx, src/app/majors/_component/_table/majors-trash-table.tsx |
| `src/app/majors/_component/_table/majors-table.tsx` | tsx | yes | MajorsTableProps, MajorsTable | src/components/admin-data-table, src/app/majors/_component/types.ts |
| `src/app/majors/_component/_table/majors-trash-table.tsx` | tsx | yes | MajorsTrashTableProps, MajorsTrashTable | src/components/admin-data-table, src/components/admin-table-pagination-footer.tsx, src/app/majors/_component/types.ts |
| `src/app/majors/_component/columns.tsx` | tsx | yes | getMajorColumns, getTrashColumns | src/app/majors/_component/types.ts |
| `src/app/majors/_component/index.ts` | ts | no | majorFormSchema, getMajorColumns, getTrashColumns, useMajorDetailQuery, useMajorsListQuery, useMajorsTrashQuery, useColumnFiltersChange, useClearListFilters, useClearTrashFilters, buildMajorPayload, u | src/app/majors/_component/types.ts, src/app/majors/_component/columns.tsx, src/app/majors/_component/_query, src/app/majors/_component/_hooks, src/app/majors/_component/_form, src/app/majors/_componen |
| `src/app/majors/_component/types.ts` | ts | no | MajorRow, MajorConfirmAction, majorFormSchema, MajorFormValues, MajorDetail |  |
| `src/app/majors/new/page.tsx` | page | yes | NewMajorPage | src/components/admin-page-guard.tsx, src/lib/api.ts, src/app/majors/_component |
| `src/app/majors/page.tsx` | page | yes | MajorsPage | src/hooks/use-debounced-value.ts, src/providers/auth-provider.tsx, src/components/admin-page-guard.tsx, src/lib/api.ts, src/app/majors/_component |
| `src/app/my-students/_component/detailed-scores-list.tsx` | tsx | yes | DetailedScoresList | src/components/admin-data-table, src/types/student-scores.ts, src/app/my-students/_component/score-utils.ts |
| `src/app/my-students/_component/index.ts` | ts | no | StudentScoresSection, DetailedScoresList, YearAveragesList, TermAveragesList, formatScore, formatGrade | src/app/my-students/_component/student-scores-section.tsx, src/app/my-students/_component/detailed-scores-list.tsx, src/app/my-students/_component/year-averages-list.tsx, src/app/my-students/_componen |
| `src/app/my-students/_component/score-utils.ts` | ts | no | formatScore, formatGrade |  |
| `src/app/my-students/_component/student-scores-section.tsx` | tsx | yes | StudentScoresSection | src/app/my-students/_component/year-averages-list.tsx, src/app/my-students/_component/term-averages-list.tsx, src/app/my-students/_component/detailed-scores-list.tsx, src/types/student-scores.ts |
| `src/app/my-students/_component/term-averages-list.tsx` | tsx | yes | TermAveragesList | src/components/admin-data-table, src/types/student-scores.ts, src/app/my-students/_component/score-utils.ts |
| `src/app/my-students/_component/year-averages-list.tsx` | tsx | yes | YearAveragesList | src/components/admin-data-table, src/types/student-scores.ts, src/app/my-students/_component/score-utils.ts |
| `src/app/my-students/page.tsx` | page | yes | MyStudentsPage | src/providers/auth-provider.tsx, src/lib/api.ts, src/app/my-students/_component, src/types/student-scores.ts |
| `src/app/page.tsx` | page | yes | QUICK_LINKS, AdminDashboardPage | src/providers/auth-provider.tsx, src/lib/api.ts, src/types/dashboard.ts, src/components/dashboard-charts.tsx |
| `src/app/parent-students/_component/_query/index.ts` | ts | no |  | src/app/parent-students/_component/_query/use-parent-students-queries.ts |
| `src/app/parent-students/_component/_query/use-parent-students-queries.ts` | ts | yes | useReviewParentStudentMutation | src/lib/api.ts |
| `src/app/parent-students/_component/_table/index.ts` | ts | no |  | src/app/parent-students/_component/_table/parent-student-table.tsx |
| `src/app/parent-students/_component/_table/parent-student-table.tsx` | tsx | yes | ParentStudentTableProps, ParentStudentTable | src/components/admin-data-table, src/components/admin-table-pagination-footer.tsx, src/app/parent-students/_component/types.ts |
| `src/app/parent-students/_component/columns.tsx` | tsx | yes | ParentStudentsColumnsProps, getParentStudentsColumns | src/app/parent-students/_component/types.ts |
| `src/app/parent-students/_component/index.ts` | ts | no |  | src/app/parent-students/_component/types.ts, src/app/parent-students/_component/columns.tsx, src/app/parent-students/_component/_query, src/app/parent-students/_component/_table |
| `src/app/parent-students/_component/types.ts` | ts | no | PARENT_STUDENT_STATUSES, PARENT_STUDENT_STATUS_LABELS, PARENT_STUDENT_STATUS_COLORS |  |
| `src/app/parent-students/page.tsx` | page | yes | AdminParentStudentsPage | src/components/admin-confirm-action-dialog.tsx, src/components/admin-page-guard.tsx, src/lib, src/lib/api.ts, src/hooks/use-debounced-value.ts, src/app/parent-students/_component/_table, src/app/paren |
| `src/app/posts/[id]/edit/page.tsx` | page | yes | EditPostPage | src/components/admin-page-guard.tsx, src/lib/api.ts, src/app/posts/_component, src/app/posts/_component/_query |
| `src/app/posts/[id]/page.tsx` | page | yes | PostDetailPage | src/components/admin-page-guard.tsx, src/lib/api.ts, src/app/posts/_component, src/app/posts/_component/_query |
| `src/app/posts/_component/_alert-dialog/index.ts` | ts | no | PostsConfirmDialog | src/app/posts/_component/_alert-dialog/posts-confirm-dialog.tsx |
| `src/app/posts/_component/_alert-dialog/posts-confirm-dialog.tsx` | tsx | yes | PostsConfirmDialogProps, PostsConfirmDialog | src/components/admin-confirm-action-dialog.tsx, src/app/posts/_component/types.ts |
| `src/app/posts/_component/_form/index.ts` | ts | no | PostFormShell | src/app/posts/_component/_form/post-form-shell.tsx |
| `src/app/posts/_component/_form/post-form-shell.tsx` | tsx | yes | PostFormShellProps, PostFormShell | src/app/posts/_component/utils.ts, src/app/posts/_component/_hooks, src/app/posts/_component/types.ts |
| `src/app/posts/_component/_hooks/index.ts` | ts | no | useColumnFiltersChange, useClearListFilters, useClearTrashFilters, useHandleConfirmActionWithAction, usePostForm, postFormSchema | src/hooks/use-table-filters.ts, src/app/posts/_component/_hooks/use-posts-actions.ts, src/app/posts/_component/_hooks/use-post-form.ts |
| `src/app/posts/_component/_hooks/use-post-form.ts` | ts | yes | postFormSchema, PostFormValues, usePostForm | src/app/posts/_component/utils.ts |
| `src/app/posts/_component/_hooks/use-posts-actions.ts` | ts | no | UsePostsActionsProps, useHandleConfirmActionWithAction | src/app/posts/_component/types.ts |
| `src/app/posts/_component/_hooks/use-posts-filters.ts` | ts | no | useColumnFiltersChange, useClearListFilters, useClearTrashFilters |  |
| `src/app/posts/_component/_query/index.ts` | ts | no | usePostsQuery, useTrashQuery, usePostDetailQuery, useCategoriesQuery, useTagsQuery, useDeleteMutation, useRestoreMutation, usePurgeMutation, useBulkMutation | src/app/posts/_component/_query/use-posts-queries.ts, src/app/posts/_component/_query/use-taxonomy-queries.ts, src/app/posts/_component/_query/use-posts-mutations.ts |
| `src/app/posts/_component/_query/use-posts-mutations.ts` | ts | no | UsePostsMutationsProps, useDeleteMutation, useRestoreMutation, usePurgeMutation, useBulkMutation | src/app/posts/_component/types.ts |
| `src/app/posts/_component/_query/use-posts-queries.ts` | ts | no | usePostDetailQuery, UsePostsQueriesProps, usePostsQuery, UseTrashQueryProps, useTrashQuery, UsePostsByAuthorProps, usePostsByAuthor | src/app/posts/_component/types.ts |
| `src/app/posts/_component/_query/use-taxonomy-queries.ts` | ts | no | useCategoriesQuery, useTagsQuery | src/app/posts/_component/types.ts |
| `src/app/posts/_component/_table/index.ts` | ts | no | PostsTable, PostsTrashTable | src/app/posts/_component/_table/posts-table.tsx, src/app/posts/_component/_table/posts-trash-table.tsx |
| `src/app/posts/_component/_table/posts-table.tsx` | tsx | yes | PostsTableProps, PostsTable | src/components/admin-data-table, src/components/admin-table-pagination-footer.tsx, src/app/posts/_component/types.ts |
| `src/app/posts/_component/_table/posts-trash-table.tsx` | tsx | yes | PostsTrashTableProps, PostsTrashTable | src/components/admin-data-table, src/components/admin-table-pagination-footer.tsx, src/app/posts/_component/types.ts |
| `src/app/posts/_component/columns.tsx` | tsx | yes | getPostColumns, getTrashColumns | src/app/posts/_component/types.ts, src/app/posts/_component/summary-badges.tsx |
| `src/app/posts/_component/index.ts` | ts | no | createParagraphNode, createSerializedEditorState, slugify, getSeoStatus, buildCategoryOptionTree, unwrapEnvelope, normalizePaged, buildPostsFilterQuery, isSerializedEditorState, fromLocalInputValue, t | src/app/posts/_component/types.ts, src/app/posts/_component/utils.ts, src/app/posts/_component/summary-badges.tsx, src/app/posts/_component/columns.tsx, src/app/posts/_component/_hooks, src/app/posts/ |
| `src/app/posts/_component/summary-badges.tsx` | tsx | no | SummaryBadges | src/app/posts/_component/types.ts |
| `src/app/posts/_component/types.ts` | ts | no | TaxonomyOption, CategoryTreeOption, PostListRow, PostConfirmAction, PostDetail, FormState, EditorTextNodeShape, EditorParagraphNodeShape, EditorStateShape |  |
| `src/app/posts/_component/utils.ts` | ts | no | createParagraphNode, createSerializedEditorState, getSeoStatus, buildPostsFilterQuery, isSerializedEditorState, fromLocalInputValue, toLocalInputValue, normalizeContentForEditor, slugify, formatDateTi | src/lib, src/app/posts/_component/types.ts |
| `src/app/posts/new/page.tsx` | page | yes | NewPostPage | src/components/admin-page-guard.tsx, src/lib/api.ts, src/app/posts/_component, src/app/posts/_component/_query |
| `src/app/posts/page.tsx` | page | yes | PostsPage | src/components/admin-page-guard.tsx, src/lib/api.ts, src/app/posts/_component/_table, src/app/posts/_component/_alert-dialog, src/app/posts/_component/_hooks, src/app/posts/_component/_query, src/hook |
| `src/app/profile/page.tsx` | page | yes | AdminProfilePage | src/providers/auth-provider.tsx, src/lib/permission-labels.ts, src/hooks/queries.ts, src/lib/api.ts, src/lib/auth-session.ts, src/components/admin-page-guard.tsx |
| `src/app/rbac/_component/_alert-dialog/role-dialog.tsx` | tsx | yes | RoleDialogProps, RoleDialog | src/app/rbac/_component/types.ts |
| `src/app/rbac/_component/_query/index.ts` | ts | no |  | src/app/rbac/_component/_query/use-rbac-queries.ts |
| `src/app/rbac/_component/_query/use-rbac-queries.ts` | ts | yes | rbacQueryKeys, useRbacCatalog, useCreateRoleMutation, useUpdateRoleMutation, useDeleteRoleMutation | src/lib/api.ts, src/app/rbac/_component/types.ts |
| `src/app/rbac/_component/columns.tsx` | tsx | yes | RbacColumnsProps, getRbacColumns |  |
| `src/app/rbac/_component/index.ts` | ts | no |  | src/app/rbac/_component/types.ts, src/app/rbac/_component/columns.tsx, src/app/rbac/_component/_alert-dialog/role-dialog.tsx |
| `src/app/rbac/_component/types.ts` | ts | no | PERMISSION_GROUPS, CreateRoleInput, UpdateRoleInput |  |
| `src/app/register/page.tsx` | page | no | RegisterPage | src/features/auth/register-form.tsx |
| `src/app/robots.ts` | ts | no | robots |  |
| `src/app/speakers/[id]/edit/page.tsx` | page | yes | EditSpeakerPage | src/components/admin-page-guard.tsx, src/lib/api.ts, src/app/speakers/_component |
| `src/app/speakers/[id]/page.tsx` | page | yes | SpeakerDetailPage | src/components/admin-page-guard.tsx, src/lib/api.ts, src/app/speakers/_component |
| `src/app/speakers/_component/_alert-dialog/index.ts` | ts | no | SpeakersConfirmDialog | src/app/speakers/_component/_alert-dialog/speakers-confirm-dialog.tsx |
| `src/app/speakers/_component/_alert-dialog/speakers-confirm-dialog.tsx` | tsx | yes | SpeakersConfirmDialogProps, SpeakersConfirmDialog | src/components/admin-confirm-action-dialog.tsx, src/app/speakers/_component/types.ts |
| `src/app/speakers/_component/_form/index.ts` | ts | no | SpeakerFormShell | src/app/speakers/_component/_form/speaker-form-shell.tsx |
| `src/app/speakers/_component/_form/speaker-form-shell.tsx` | tsx | yes | SpeakerFormShellProps, SpeakerFormShell | src/app/speakers/_component/types.ts |
| `src/app/speakers/_component/_hooks/index.ts` | ts | no | useColumnFiltersChange, useClearListFilters, useClearTrashFilters, buildSpeakerPayload, useSpeakerForm, useHandleConfirmAction, useConfirmAction | src/hooks/use-table-filters.ts, src/app/speakers/_component/_hooks/use-speakers-actions.ts |
| `src/app/speakers/_component/_hooks/use-speakers-actions.ts` | ts | no | buildSpeakerPayload, useSpeakerForm, useHandleConfirmAction, useConfirmAction | src/app/speakers/_component/types.ts |
| `src/app/speakers/_component/_query/index.ts` | ts | no | useSpeakerDetailQuery, useSpeakersListQuery, useSpeakersTrashQuery | src/app/speakers/_component/_query/use-speakers-queries.ts |
| `src/app/speakers/_component/_query/use-speakers-queries.ts` | ts | no | useSpeakerDetailQuery, useSpeakersListQuery, UseTrashQueryProps, useSpeakersTrashQuery | src/app/speakers/_component/types.ts |
| `src/app/speakers/_component/_table/index.ts` | ts | no | SpeakersTable, SpeakersTrashTable | src/app/speakers/_component/_table/speakers-table.tsx, src/app/speakers/_component/_table/speakers-trash-table.tsx |
| `src/app/speakers/_component/_table/speakers-table.tsx` | tsx | yes | SpeakersTableProps, SpeakersTable | src/components/admin-data-table, src/app/speakers/_component/types.ts |
| `src/app/speakers/_component/_table/speakers-trash-table.tsx` | tsx | yes | SpeakersTrashTableProps, SpeakersTrashTable | src/components/admin-data-table, src/components/admin-table-pagination-footer.tsx, src/app/speakers/_component/types.ts |
| `src/app/speakers/_component/columns.tsx` | tsx | yes | getSpeakerColumns, getTrashColumns | src/app/speakers/_component/types.ts |
| `src/app/speakers/_component/index.ts` | ts | no | speakerFormSchema, getSpeakerColumns, getTrashColumns, useSpeakerDetailQuery, useSpeakersListQuery, useSpeakersTrashQuery, useColumnFiltersChange, useClearListFilters, useClearTrashFilters, buildSpeak | src/app/speakers/_component/types.ts, src/app/speakers/_component/columns.tsx, src/app/speakers/_component/_query, src/app/speakers/_component/_hooks, src/app/speakers/_component/_form, src/app/speake |
| `src/app/speakers/_component/types.ts` | ts | no | SpeakerRow, SpeakerConfirmAction, speakerFormSchema, SpeakerFormValues, SpeakerDetail |  |
| `src/app/speakers/new/page.tsx` | page | yes | NewSpeakerPage | src/components/admin-page-guard.tsx, src/lib/api.ts, src/app/speakers/_component |
| `src/app/speakers/page.tsx` | page | yes | SpeakersPage | src/hooks/use-debounced-value.ts, src/providers/auth-provider.tsx, src/components/admin-page-guard.tsx, src/lib/api.ts, src/app/speakers/_component |
| `src/app/staff/[id]/edit/page.tsx` | page | yes | EditStaffPage | src/app/staff/_component, src/app/staff/_component/_form, src/hooks/queries.ts, src/providers/auth-provider.tsx, src/components/admin-page-guard.tsx, src/lib/api.ts |
| `src/app/staff/[id]/page.tsx` | page | yes | StaffDetailPage | src/hooks/queries.ts, src/providers/auth-provider.tsx, src/components/admin-page-guard.tsx, src/app/posts/_component/_query/use-posts-queries.ts, src/lib/api.ts, src/components/admin-data-table/admin- |
| `src/app/staff/_component/_alert-dialog/index.ts` | ts | no | StaffConfirmDialog, StaffBulkConfirmDialog | src/app/staff/_component/_alert-dialog/staff-confirm-dialog.tsx |
| `src/app/staff/_component/_alert-dialog/staff-confirm-dialog.tsx` | tsx | no | StaffConfirmDialog, StaffBulkConfirmDialog | src/components/admin-confirm-action-dialog.tsx, src/app/staff/_component/types.ts |
| `src/app/staff/_component/_form/index.ts` | ts | no | StaffFormShell | src/app/staff/_component/_form/staff-form-shell.tsx |
| `src/app/staff/_component/_form/staff-form-shell.tsx` | tsx | yes | StaffFormShellProps, StaffFormShell | src/app/staff/_component/_hooks/use-staff-form.ts, src/lib/auth-session.ts |
| `src/app/staff/_component/_hooks/index.ts` | ts | no | useStaffForm, staffFormSchema | src/app/staff/_component/_hooks/use-staff-form.ts |
| `src/app/staff/_component/_hooks/use-staff-form.ts` | ts | no | staffFormSchema, StaffFormValues, useStaffForm |  |
| `src/app/staff/_component/_query/index.ts` | ts | no | useStaffMutations | src/app/staff/_component/_query/use-staff-queries.ts |
| `src/app/staff/_component/_query/use-staff-queries.ts` | ts | no | UseStaffMutationsProps, useStaffMutations | src/lib/api.ts, src/hooks/queries.ts |
| `src/app/staff/_component/_table/index.ts` | ts | no | StaffTable, StaffTrashTable | src/app/staff/_component/_table/staff-table.tsx, src/app/staff/_component/_table/staff-trash-table.tsx |
| `src/app/staff/_component/_table/staff-table.tsx` | tsx | no | StaffTable | src/components/admin-data-table, src/components/admin-table-pagination-footer.tsx, src/app/staff/_component/columns.tsx, src/app/staff/_component/types.ts |
| `src/app/staff/_component/_table/staff-trash-table.tsx` | tsx | no | StaffTrashTable | src/components/admin-data-table, src/components/admin-table-pagination-footer.tsx, src/app/staff/_component/columns.tsx, src/app/staff/_component/types.ts |
| `src/app/staff/_component/columns.tsx` | tsx | no | StaffColumnsProps, getStaffColumns, getTrashColumns | src/app/staff/_component/types.ts |
| `src/app/staff/_component/index.ts` | ts | no | buildUsersFilterQuery, getStaffColumns, getTrashColumns, useStaffForm, staffFormSchema, useStaffMutations, StaffTable, StaffTrashTable, StaffFormShell, StaffConfirmDialog, StaffBulkConfirmDialog | src/app/staff/_component/types.ts, src/app/staff/_component/utils.ts, src/app/staff/_component/columns.tsx, src/app/staff/_component/_hooks, src/app/staff/_component/_query, src/app/staff/_component/_ |
| `src/app/staff/_component/types.ts` | ts | no | StaffRow, StaffConfirmAction |  |
| `src/app/staff/_component/utils.ts` | ts | no | buildUsersFilterQuery | src/lib |
| `src/app/staff/new/page.tsx` | page | yes | NewStaffPage | src/app/staff/_component, src/app/staff/_component/_form, src/hooks/queries.ts, src/providers/auth-provider.tsx, src/components/admin-page-guard.tsx, src/lib/api.ts |
| `src/app/staff/page.tsx` | page | yes | StaffPage | src/components/admin-page-guard.tsx, src/hooks/queries.ts, src/hooks/use-debounced-value.ts, src/lib/api.ts, src/providers/auth-provider.tsx, src/app/staff/_component |
| `src/app/tags/[id]/edit/page.tsx` | page | yes | EditTagPage | src/components/admin-page-guard.tsx, src/lib/api.ts, src/app/tags/_component |
| `src/app/tags/[id]/page.tsx` | page | yes | TagDetailPage | src/components/admin-page-guard.tsx, src/lib/api.ts, src/app/tags/_component |
| `src/app/tags/_component/_alert-dialog/index.ts` | ts | no | TagsConfirmDialog | src/app/tags/_component/_alert-dialog/tags-confirm-dialog.tsx |
| `src/app/tags/_component/_alert-dialog/tags-confirm-dialog.tsx` | tsx | yes | TagsConfirmDialogProps, TagsConfirmDialog | src/components/admin-confirm-action-dialog.tsx, src/app/tags/_component/types.ts |
| `src/app/tags/_component/_form/index.ts` | ts | no | TagFormShell | src/app/tags/_component/_form/tag-form-shell.tsx |
| `src/app/tags/_component/_form/tag-form-shell.tsx` | tsx | yes | TagFormShellProps, TagFormShell | src/app/tags/_component/types.ts |
| `src/app/tags/_component/_hooks/index.ts` | ts | no | useColumnFiltersChange, useClearListFilters, useClearTrashFilters, buildTagPayload, useTagForm, useHandleConfirmAction, useConfirmAction | src/hooks/use-table-filters.ts, src/app/tags/_component/_hooks/use-tags-actions.ts |
| `src/app/tags/_component/_hooks/use-tags-actions.ts` | ts | no | buildTagPayload, useTagForm, useHandleConfirmAction, useConfirmAction | src/app/tags/_component/types.ts |
| `src/app/tags/_component/_query/index.ts` | ts | no | useTagDetailQuery, useTagsListQuery, UseTrashQueryProps, useTrashQuery | src/app/tags/_component/types.ts, src/lib/api.ts, src/app/tags/_component/utils.ts |
| `src/app/tags/_component/_table/index.ts` | ts | no | TagsTable, TagsTrashTable | src/app/tags/_component/_table/tags-table.tsx, src/app/tags/_component/_table/tags-trash-table.tsx |
| `src/app/tags/_component/_table/tags-table.tsx` | tsx | yes | TagsTableProps, TagsTable | src/components/admin-data-table, src/app/tags/_component/types.ts |
| `src/app/tags/_component/_table/tags-trash-table.tsx` | tsx | yes | TagsTrashTableProps, TagsTrashTable | src/components/admin-data-table, src/components/admin-table-pagination-footer.tsx, src/app/tags/_component/types.ts |
| `src/app/tags/_component/columns.tsx` | tsx | yes | getTagColumns, getTrashColumns | src/app/tags/_component/types.ts, src/app/tags/_component/utils.ts |
| `src/app/tags/_component/index.ts` | ts | no | tagFormSchema, slugify, unwrapEnvelope, normalizePaged, formatDateTime, humanizeSlug, sortTagsByName, buildTagTree, buildTagsFilterQuery, toFilterQuery, getTagColumns, getTrashColumns, useTagDetailQue | src/app/tags/_component/types.ts, src/app/tags/_component/utils.ts, src/app/tags/_component/columns.tsx, src/app/tags/_component/_query, src/app/tags/_component/_hooks, src/app/tags/_component/_form,  |
| `src/app/tags/_component/types.ts` | ts | no | TagRow, TagTreeRow, TagConfirmAction, tagFormSchema, TagFormValues, TagDetail |  |
| `src/app/tags/_component/utils.ts` | ts | no | formatDateTime, humanizeSlug, sortTagsByName, buildTagTree, buildTagsFilterQuery, toFilterQuery, slugify, unwrapEnvelope, normalizePaged | src/lib, src/app/tags/_component/types.ts, src/lib/api.ts |
| `src/app/tags/new/page.tsx` | page | yes | NewTagPage | src/components/admin-page-guard.tsx, src/lib/api.ts, src/app/tags/_component |
| `src/app/tags/page.tsx` | page | yes | TagsPage | src/hooks/use-debounced-value.ts, src/providers/auth-provider.tsx, src/components/admin-page-guard.tsx, src/lib/api.ts, src/app/tags/_component |
| `src/app/training-levels/[id]/edit/page.tsx` | page | yes | EditTrainingLevelPage | src/components/admin-page-guard.tsx, src/lib/api.ts, src/app/training-levels/_component |
| `src/app/training-levels/[id]/page.tsx` | page | yes | TrainingLevelDetailPage | src/components/admin-page-guard.tsx, src/lib/api.ts, src/app/training-levels/_component |
| `src/app/training-levels/_component/_alert-dialog/index.ts` | ts | no | TrainingLevelsConfirmDialog | src/app/training-levels/_component/_alert-dialog/training-levels-confirm-dialog.tsx |
| `src/app/training-levels/_component/_alert-dialog/training-levels-confirm-dialog.tsx` | tsx | yes | TrainingLevelsConfirmDialogProps, TrainingLevelsConfirmDialog | src/components/admin-confirm-action-dialog.tsx, src/app/training-levels/_component/types.ts |
| `src/app/training-levels/_component/_form/index.ts` | ts | no | TrainingLevelFormShell | src/app/training-levels/_component/_form/training-level-form-shell.tsx |
| `src/app/training-levels/_component/_form/training-level-form-shell.tsx` | tsx | yes | TrainingLevelFormShellProps, TrainingLevelFormShell | src/app/training-levels/_component/types.ts |
| `src/app/training-levels/_component/_hooks/index.ts` | ts | no | useColumnFiltersChange, useClearListFilters, useClearTrashFilters, buildTrainingLevelPayload, useTrainingLevelForm, useHandleConfirmAction, useConfirmAction | src/hooks/use-table-filters.ts, src/app/training-levels/_component/_hooks/use-training-levels-actions.ts |
| `src/app/training-levels/_component/_hooks/use-training-levels-actions.ts` | ts | no | buildTrainingLevelPayload, useTrainingLevelForm, useHandleConfirmAction, useConfirmAction | src/app/training-levels/_component/types.ts |
| `src/app/training-levels/_component/_query/index.ts` | ts | no | useTrainingLevelDetailQuery, useTrainingLevelsListQuery, UseTrashQueryProps, useTrainingLevelsTrashQuery | src/app/training-levels/_component/types.ts |
| `src/app/training-levels/_component/_table/index.ts` | ts | no | TrainingLevelsTable, TrainingLevelsTrashTable | src/app/training-levels/_component/_table/training-levels-table.tsx, src/app/training-levels/_component/_table/training-levels-trash-table.tsx |
| `src/app/training-levels/_component/_table/training-levels-table.tsx` | tsx | yes | TrainingLevelsTableProps, TrainingLevelsTable | src/components/admin-data-table, src/app/training-levels/_component/types.ts |
| `src/app/training-levels/_component/_table/training-levels-trash-table.tsx` | tsx | yes | TrainingLevelsTrashTableProps, TrainingLevelsTrashTable | src/components/admin-data-table, src/components/admin-table-pagination-footer.tsx, src/app/training-levels/_component/types.ts |
| `src/app/training-levels/_component/columns.tsx` | tsx | yes | getTrainingLevelColumns, getTrashColumns | src/app/training-levels/_component/types.ts |
| `src/app/training-levels/_component/index.ts` | ts | no | entityFormSchema, getTrainingLevelColumns, getTrashColumns, useTrainingLevelDetailQuery, useTrainingLevelsListQuery, useTrainingLevelsTrashQuery, useColumnFiltersChange, useClearListFilters, useClearT | src/app/training-levels/_component/types.ts, src/app/training-levels/_component/columns.tsx, src/app/training-levels/_component/_query, src/app/training-levels/_component/_hooks, src/app/training-leve |
| `src/app/training-levels/_component/types.ts` | ts | no | TrainingLevelRow, TrainingLevelConfirmAction, entityFormSchema, TrainingLevelFormValues, TrainingLevelDetail |  |
| `src/app/training-levels/new/page.tsx` | page | yes | NewTrainingLevelPage | src/components/admin-page-guard.tsx, src/lib/api.ts, src/app/training-levels/_component |
| `src/app/training-levels/page.tsx` | page | yes | TrainingLevelsPage | src/hooks/use-debounced-value.ts, src/providers/auth-provider.tsx, src/components/admin-page-guard.tsx, src/lib/api.ts, src/app/training-levels/_component |
| `src/app/training-systems/[id]/edit/page.tsx` | page | yes | EditTrainingSystemPage | src/components/admin-page-guard.tsx, src/lib/api.ts, src/app/training-systems/_component |
| `src/app/training-systems/[id]/page.tsx` | page | yes | TrainingSystemDetailPage | src/components/admin-page-guard.tsx, src/lib/api.ts, src/app/training-systems/_component |
| `src/app/training-systems/_component/_alert-dialog/index.ts` | ts | no | TrainingSystemsConfirmDialog | src/app/training-systems/_component/_alert-dialog/training-systems-confirm-dialog.tsx |
| `src/app/training-systems/_component/_alert-dialog/training-systems-confirm-dialog.tsx` | tsx | yes | TrainingSystemsConfirmDialogProps, TrainingSystemsConfirmDialog | src/components/admin-confirm-action-dialog.tsx, src/app/training-systems/_component/types.ts |
| `src/app/training-systems/_component/_form/index.ts` | ts | no | TrainingSystemFormShell | src/app/training-systems/_component/_form/training-system-form-shell.tsx |
| `src/app/training-systems/_component/_form/training-system-form-shell.tsx` | tsx | yes | TrainingSystemFormShellProps, TrainingSystemFormShell | src/app/training-systems/_component/types.ts |
| `src/app/training-systems/_component/_hooks/index.ts` | ts | no | useColumnFiltersChange, useClearListFilters, useClearTrashFilters, buildTrainingSystemPayload, useTrainingSystemForm, useHandleConfirmAction, useConfirmAction | src/hooks/use-table-filters.ts, src/app/training-systems/_component/_hooks/use-training-systems-actions.ts |
| `src/app/training-systems/_component/_hooks/use-training-systems-actions.ts` | ts | no | buildTrainingSystemPayload, useTrainingSystemForm, useHandleConfirmAction, useConfirmAction | src/app/training-systems/_component/types.ts |
| `src/app/training-systems/_component/_query/index.ts` | ts | no | useTrainingSystemDetailQuery, useTrainingSystemsListQuery, UseTrashQueryProps, useTrainingSystemsTrashQuery | src/app/training-systems/_component/types.ts |
| `src/app/training-systems/_component/_table/index.ts` | ts | no | TrainingSystemsTable, TrainingSystemsTrashTable | src/app/training-systems/_component/_table/training-systems-table.tsx, src/app/training-systems/_component/_table/training-systems-trash-table.tsx |
| `src/app/training-systems/_component/_table/training-systems-table.tsx` | tsx | yes | TrainingSystemsTableProps, TrainingSystemsTable | src/components/admin-data-table, src/app/training-systems/_component/types.ts |
| `src/app/training-systems/_component/_table/training-systems-trash-table.tsx` | tsx | yes | TrainingSystemsTrashTableProps, TrainingSystemsTrashTable | src/components/admin-data-table, src/components/admin-table-pagination-footer.tsx, src/app/training-systems/_component/types.ts |
| `src/app/training-systems/_component/columns.tsx` | tsx | yes | getTrainingSystemColumns, getTrashColumns | src/app/training-systems/_component/types.ts |
| `src/app/training-systems/_component/index.ts` | ts | no | entityFormSchema, getTrainingSystemColumns, getTrashColumns, useTrainingSystemDetailQuery, useTrainingSystemsListQuery, useTrainingSystemsTrashQuery, useColumnFiltersChange, useClearListFilters, useCl | src/app/training-systems/_component/types.ts, src/app/training-systems/_component/columns.tsx, src/app/training-systems/_component/_query, src/app/training-systems/_component/_hooks, src/app/training- |
| `src/app/training-systems/_component/types.ts` | ts | no | TrainingSystemRow, TrainingSystemConfirmAction, entityFormSchema, TrainingSystemFormValues, TrainingSystemDetail |  |
| `src/app/training-systems/new/page.tsx` | page | yes | NewTrainingSystemPage | src/components/admin-page-guard.tsx, src/lib/api.ts, src/app/training-systems/_component |
| `src/app/training-systems/page.tsx` | page | yes | TrainingSystemsPage | src/hooks/use-debounced-value.ts, src/providers/auth-provider.tsx, src/components/admin-page-guard.tsx, src/lib/api.ts, src/app/training-systems/_component |
| `src/components/admin-confirm-action-dialog.tsx` | tsx | yes | AdminConfirmActionDialog |  |
| `src/components/admin-data-table/index.ts` | ts | no | AdminDataTable | src/components/admin-data-table/admin-data-table.tsx |
| `src/components/admin-data-table/table-meta.ts` | ts | no |  |  |
| `src/components/admin-notification-bell.tsx` | tsx | yes | AdminNotificationBell |  |
| `src/components/admin-page-guard.tsx` | tsx | yes | AdminPageGuard | src/providers/auth-provider.tsx |
| `src/components/admin-shell.tsx` | tsx | yes | AdminShell | src/components/sidebar.tsx, src/providers/auth-provider.tsx, src/components/admin-notification-bell.tsx, src/components/scroll-to-top.tsx, src/lib/auth-session.ts, src/lib/auth-routes.ts |
| `src/components/admin-table-pagination-footer.tsx` | tsx | yes | ADMIN_TABLE_PAGE_SIZE_OPTIONS, AdminTablePaginationFooterProps, AdminTablePaginationFooter |  |
| `src/components/api-scope-notice.tsx` | tsx | yes | ApiScopeNotice |  |
| `src/components/dashboard-charts.tsx` | tsx | yes | MonthlyLineChart, MonthlyBarChart, CategoryDoughnutChart, TopPostsChart | src/types/dashboard.ts |
| `src/components/scroll-to-top.tsx` | tsx | yes | ScrollToTop |  |
| `src/components/sidebar.tsx` | tsx | yes | getVisibleMenuItems, SidebarNavLinks, MobileSidebarPanel, Sidebar | src/providers/auth-provider.tsx, src/lib/api.ts |
| `src/features/auth/admin-bridge.ts` | ts | no | getAdminBaseUrl, buildAdminBridgeLoginUrl, getAdminLoginUrl |  |
| `src/features/auth/auth-api.ts` | ts | no | AuthLoginPayload, RegisterRequestPayload, RegisterLeadPayload, DevLoginOption, loginWithEmail, loginWithGoogle, fetchGoogleOAuthConfig, loginWithDevelopmentUser, toAdminSessionUser, registerAccount, s |  |
| `src/features/auth/index.ts` | ts | no | SignInForm, RegisterForm | src/features/auth/sign-in-form.tsx, src/features/auth/register-form.tsx |
| `src/features/auth/register-form.tsx` | tsx | yes | RegisterForm | src/lib/auth-routes.ts, src/features/auth/auth-api.ts |
| `src/features/auth/session.ts` | ts | no | StoreSessionPayload, toStoreSession, persistSession | src/features/auth/auth-api.ts |
| `src/features/auth/sign-in-form.tsx` | tsx | yes | SignInForm | src/providers/auth-provider.tsx, src/features/auth/auth-api.ts, src/lib/auth-routes.ts, src/lib/auth-session.ts |
| `src/hooks/index.ts` | ts | no | useDebouncedValue, useAdminTableState | src/hooks/use-debounced-value.ts, src/hooks/use-admin-table-state.ts |
| `src/hooks/queries.ts` | ts | yes | queryKeys, UsersListData, RbacCatalog, ContactRequestsData, MyStudentsData, ParentStudentsData, useStaffProfile, useUpdateStaffProfile, useChangeStaffPassword, useRbacCatalog, useStaffUserList, useTra | src/lib/api.ts |
| `src/hooks/use-admin-table-state.ts` | ts | yes | AdminTableTab, UseAdminTableStateOptions, UseAdminTableStateReturn, useAdminTableState | src/hooks/use-debounced-value.ts |
| `src/hooks/use-debounced-value.ts` | ts | yes | useDebouncedValue |  |
| `src/hooks/use-table-filters.ts` | ts | no | useColumnFiltersChange, useClearListFilters, useClearTrashFilters |  |
| `src/lib/admin-ui.ts` | ts | no | ADMIN_INFO_CARD_CLASS, ADMIN_LOGIN_PANEL_CLASS |  |
| `src/lib/api.ts` | ts | no | api, ApiError | src/lib/auth-session.ts |
| `src/lib/auth-routes.ts` | ts | no | AUTH_LOGIN_PATH, AUTH_REGISTER_PATH, AUTH_PATHS, AuthPath, isAuthPath, getAdminAppHomeExternalPath, getAdminLoginExternalPath |  |
| `src/lib/auth-session.ts` | ts | no | ADMIN_SESSION_KEY, ADMIN_SESSION_EVENT, readAdminSession, writeAdminSession, patchAdminSessionProfile, clearAdminSession, getAdminUserId, getAdminDevAuthLogContext |  |
| `src/lib/build-admin-filter-query.ts` | ts | no | FilterMapping, normalizeAdminFilterValue, normalizeAdminFilterValues, buildAdminFilterQuery, COMMON_FILTER_MAPPINGS |  |
| `src/lib/build-table-csv.ts` | ts | no | buildCsvFromColumns |  |
| `src/lib/category-icons.ts` | ts | no | CATEGORY_ICON_OPTIONS, resolveCategoryIcon |  |
| `src/lib/dev-demo-accounts.ts` | ts | no | DevDemoAccount, DEV_DEMO_ACCOUNTS, isDevDemoLoginEnabled |  |
| `src/lib/export-csv.ts` | ts | no | CsvDelimiter, CsvEncoding, CsvExportOptions, escapeDelimitedField, escapeCsvField, rowsToCsvContent, csvToBlobParts, csvToUtf8BlobParts, downloadCsvFile |  |
| `src/lib/export-xlsx.ts` | ts | no | csvBaseToXlsxFilename |  |
| `src/lib/format.ts` | ts | no | formatVND, formatDate |  |
| `src/lib/index.ts` | ts | no | buildAdminFilterQuery, COMMON_FILTER_MAPPINGS, normalizeAdminFilterValue, normalizeAdminFilterValues, buildCsvFromColumns, downloadCsvFile, csvBaseToXlsxFilename, downloadXlsxFile, formatVND, formatDa | src/lib/build-admin-filter-query.ts, src/lib/build-table-csv.ts, src/lib/export-csv.ts, src/lib/export-xlsx.ts, src/lib/format.ts, src/lib/category-icons.ts |
| `src/lib/permission-labels.ts` | ts | no | PERMISSION_LABEL_VI, permissionLabelVi, permissionGroupKey, permissionGroupLabelVi |  |
| `src/lib/product-price.ts` | ts | no | unitSellingAndListPrice |  |
| `src/providers/auth-provider.tsx` | tsx | yes | StaffLoginResult, AuthProvider, useAuth, useClientReady | src/features/auth/auth-api.ts, src/lib/auth-session.ts, src/lib/auth-routes.ts |
| `src/providers/query-provider.tsx` | tsx | yes | QueryProvider |  |
| `src/proxy.ts` | ts | no | proxy, config |  |
| `src/types/dashboard.ts` | ts | no | DashboardOverviewDto, DashboardMonthlyItemDto, DashboardCategoryItemDto, DashboardTopPostDto, DashboardStatsDto |  |
| `src/types/google-identity.d.ts` | ts | no |  |  |
| `src/types/student-scores.ts` | ts | no | YearAverage, TermAverage, OverallAverage, DetailedScore, StudentYearAveragesResponse, StudentTermAveragesResponse, StudentOverallAverageResponse, StudentScoresResponse |  |
| `tsconfig.json` | config | — | — | — |
## File Markdown trong scope app

Toàn bộ `.md` sinh tự động nằm trong **`apps/backend/.graphify/markdown/`**; JSON trong **`../snapshot/`** — xem mục **Mục lục artefact Graphify** ở đầu file.

- **Chỉ mục monorepo + chủ đề:** [`../../../../.graphify/markdown/SUMMARY_FOR_AI.md`](../../../../.graphify/markdown/SUMMARY_FOR_AI.md).

## Làm mới

- Cập nhật `snapshot/context.json` **và** `snapshot/graph.json`: `node apps/backend/.graphify/update.cjs`.
- Sau đó chạy: `pnpm graphify:ai-summary` (sinh thêm `FOLDER_TREE.md`, `GRAPH_STATS.md` khi có graph).
