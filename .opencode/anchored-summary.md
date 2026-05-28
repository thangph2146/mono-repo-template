# Anchored Summary — hub-parent-template

## Clean Code & Microservice Structure (Session 2)

### Critical Fix: Route Mismatch
**`packages/api-client/src/resources/my-students.ts`** — client called `/admin/my-students` but API route was `/parent/my-students`. Changed all 3 routes to `/parent/my-students`. **This was a runtime bug — the api-client could never connect to the correct endpoint.**

### Route Constants Cleanup
| File | Change |
|---|---|
| `apps/api/src/config/constants.ts` | Removed dead constants `UNREAD_COUNTS`, `PROXY_IMAGE`, `UPLOADS` (PUBLIC) |
| `apps/api/src/config/constants.ts` | Added `PARENT_STUDENTS` (`admin/parent-students`), `PARENT_MY_STUDENTS` (`parent/my-students`) |
| `apps/parent-students/parent-students.controller.ts` | Now uses `ADMIN_ROUTES.PARENT_STUDENTS` and `PUBLIC_ROUTES.PARENT_MY_STUDENTS` constants |
| `apps/notifications/notifications.controller.ts` | Now uses `ADMIN_ROUTES.BASE` instead of hardcoded `'admin'` |

### Cross-App Consistency Fixes
| File | Issue | Fix |
|---|---|---|
| `packages/api-client/src/index.ts` | `SystemApi` used in SDK but not exported | Added `export { SystemApi }` |
| `apps/backend/src/app/profile/page.tsx` | Dynamic `await import()` + stale `readAdminSession` | Static `DEFAULT_API_URL` import; removed unused imports |
| `apps/frontend/src/app/(public)/huong-dan-su-dung/page.tsx` | Hardcoded fallback `"http://localhost:3002/api"` | Uses shared `DEFAULT_API_URL` |
| `apps/api/src/uploads/uploads.controller.ts` | Missing deprecation on legacy `serve/*path` route | Added `@deprecated` JSDoc |

### Audit Results
- **`verify:bounds`**: zero violations ✅
- **`pnpm check`**: all green ✅
- **Cross-app imports**: zero violations (no `apps/*` imports between apps) ✅
- **Raw fetch patterns**: frontend only calls `/public/*` endpoints; backend uses SDK for data, raw fetch only for file upload ✅

## Upload Architecture (Session 1)
```
POST  /api/admin/uploads          (no auth)
GET   /api/uploads/images/*path   (public serve)
GET   /api/uploads/files/*path    (public serve)
```
- `getServeBaseUrl()` returns `/api/uploads` (new)
- `generateFilePath()` fallback uses `/api/uploads/` (no stale `admin/uploads/serve`)
- All `admin/uploads/serve` fallbacks cleaned from `uploads.service.ts`
- `floating-link-editor-plugin.tsx` uses `/api/uploads` (not `/api/uploads/serve`)
- Old `/api/admin/uploads/serve/*path` kept for backward compat (deprecated)
- `STORAGE_DIR` configured as `D:/HUB/data` in `.env`

## Repo Structure
- **`apps/api`** — NestJS + MikroORM (26 modules, 25 controllers, 24 entities, 6 migrations)
- **`apps/backend`** — Admin Next.js (SDK singleton via `@/lib/api`)
- **`apps/frontend`** — Storefront Next.js (SDK singleton + raw fetch for public routes)
- **`packages/api-client`** — HTTP SDK with typed resource classes (11 resources)
- Service boundaries enforced by `eslint-config/service-boundaries.js` + `scripts/verify-service-boundaries.mjs`

## Session 3 — Graphify Refresh + Route Consistent

### Graphify Snapshots (triple update)
| App | Nodes | Links | Files snapshotted |
|---|---|---|---|
| `api` | 225 | 854 | 182 |
| `backend` | 284 | 697 | 198 |
| `frontend` | 104 | 198 | 80 |

### Route Consistency — All 9 remaining controllers standardized

| Controller | Before | After |
|---|---|---|
| `training-systems` | `@Controller('admin/training-systems')` | `ADMIN_ROUTES.TRAINING_SYSTEMS` |
| `majors` | `@Controller('admin/majors')` | `ADMIN_ROUTES.MAJORS` |
| `courses` | `@Controller('admin/courses')` | `ADMIN_ROUTES.COURSES` |
| `academic-years` | `@Controller('admin/academic-years')` | `ADMIN_ROUTES.ACADEMIC_YEARS` |
| `event-types` | `@Controller('admin/event-types')` | `ADMIN_ROUTES.EVENT_TYPES` |
| `imported-users` | `@Controller('admin/imported-users')` | `ADMIN_ROUTES.IMPORTED_USERS` |
| `speakers` | `@Controller('admin/speakers')` | `ADMIN_ROUTES.SPEAKERS` |
| `locations` | `@Controller('admin/locations')` | `ADMIN_ROUTES.LOCATIONS` |
| `training-levels` | `@Controller('admin/training-levels')` | `ADMIN_ROUTES.TRAINING_LEVELS` |

Plus `notifications` and `parent-students` already fixed in Session 2.

**Result:** Zero hardcoded route strings in any NestJS controller. All routes use `ADMIN_ROUTES.*` or `PUBLIC_ROUTES.*` constants.

### Final status
- **`pnpm check:full`**: all green ✅
- **`verify:bounds`**: zero violations ✅
- **All 26 NestJS modules**: consistent route declarations ✅
- **`apps/api/.graphify/`**: refreshed with latest structure ✅
