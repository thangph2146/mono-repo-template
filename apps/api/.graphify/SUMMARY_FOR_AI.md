# REST API — @api (NestJS) — tóm tắt cho AI (Graphify)

> Tự động sinh từ `context.json` — **đọc file này trước**; tránh đọc full `context.json` (có nhúng source đầy đủ).

- **projectRoot:** `C:/ThangPham/Source/store-sync/apps/api`
- **context.generatedAt:** 2026-05-11T06:41:07.486Z

## Thống kê
- **totalFiles:** 65
- **clientComponents:** 0

## Nest — module (10)
- `src/app.module.ts`
- `src/auth/auth.module.ts`
- `src/categories/categories.module.ts`
- `src/common/logger/logger.module.ts`
- `src/data-maintenance/data-maintenance.module.ts`
- `src/orders/orders.module.ts`
- `src/products/products.module.ts`
- `src/promo-codes/promo-codes.module.ts`
- `src/rbac/rbac.module.ts`
- `src/users/users.module.ts`

## Nest — controller (8)
- `src/app.controller.ts`
- `src/categories/categories.controller.ts`
- `src/data-maintenance/data-maintenance.controller.ts`
- `src/orders/orders.controller.ts`
- `src/products/products.controller.ts`
- `src/promo-codes/promo-codes.controller.ts`
- `src/rbac/rbac.controller.ts`
- `src/users/users.controller.ts`

## Entities (12)
- `src/entities/base.entity.ts`
- `src/entities/category.entity.ts`
- `src/entities/index.ts`
- `src/entities/order.entity.ts`
- `src/entities/permission.entity.ts`
- `src/entities/product.entity.ts`
- `src/entities/promo-code.entity.ts`
- `src/entities/registry.ts`
- `src/entities/role-permission-link.entity.ts`
- `src/entities/role.entity.ts`
- `src/entities/user-role-link.entity.ts`
- `src/entities/user.entity.ts`

## Migrations (11)
- `src/migrations/Migration20260508180000.ts`
- `src/migrations/Migration20260508180500.ts`
- `src/migrations/Migration20260508190000.ts`
- `src/migrations/Migration20260508203000.ts`
- `src/migrations/Migration20260508204000.ts`
- `src/migrations/Migration20260510120000.ts`
- `src/migrations/Migration20260511120000.ts`
- `src/migrations/Migration20260511140000.ts`
- `src/migrations/Migration20260511180000.ts`
- `src/migrations/Migration20260511203000.ts`
- `src/migrations/Migration20260512140000.ts`

## Module map (không có nội dung file)

| File | Loại | Client | Exports | Imports |
|------|------|--------|---------|---------|
| `package.json` | config | — | — | — |
| `src/app.controller.spec.ts` | ts | no |  | src/app.controller.ts, src/app.service.ts |
| `src/app.controller.ts` | ts | no | AppController | src/app.service.ts |
| `src/app.module.ts` | ts | no | AppModule | src/app.controller.ts, src/app.service.ts, src/rbac/rbac.module.ts, src/config/database.config.ts, src/entities, src/products/products.module.ts, src/orders/orders.module.ts, src/users/users.module.ts |
| `src/app.service.ts` | ts | no | HealthStatus, AppService |  |
| `src/auth/auth.module.ts` | ts | no | AuthModule | src/auth/rbac.service.ts, src/auth/guards/permissions.guard.ts |
| `src/auth/decorators/public.decorator.ts` | ts | no | IS_PUBLIC_KEY, Public, PERMISSIONS_KEY, RequirePermissions, Permissions |  |
| `src/auth/guards/permissions.guard.ts` | ts | no | PermissionsGuard | src/auth/decorators/public.decorator.ts, src/auth/rbac.service.ts, src/auth/request-user.util.ts |
| `src/auth/permissions.constants.ts` | ts | no | PERMISSIONS, PermissionCode, ALL_SEED_PERMISSION_CODES |  |
| `src/auth/rbac.service.ts` | ts | no | RbacService | src/entities/user.entity.ts |
| `src/auth/request-user.util.ts` | ts | no | parseXUserId |  |
| `src/categories/categories.controller.ts` | ts | no | CategoriesController | src/entities, src/categories/categories.service.ts, src/auth/guards/permissions.guard.ts, src/auth/decorators/public.decorator.ts, src/auth/permissions.constants.ts |
| `src/categories/categories.module.ts` | ts | no | CategoriesModule | src/auth/auth.module.ts, src/entities, src/categories/categories.service.ts, src/categories/categories.controller.ts |
| `src/categories/categories.service.ts` | ts | no | CategoryUsage, CategoriesService | src/entities |
| `src/common/logger/app-logger.service.ts` | ts | no | LogPayload, AppLogger |  |
| `src/common/logger/dev-http-logging.ts` | ts | no | registerDevHttpLogging | src/common/logger/app-logger.service.ts |
| `src/common/logger/index.ts` | ts | no | AppLogger, LoggerModule, registerDevHttpLogging | src/common/logger/app-logger.service.ts, src/common/logger/logger.module.ts, src/common/logger/dev-http-logging.ts |
| `src/common/logger/logger.module.ts` | ts | no | LoggerModule | src/common/logger/app-logger.service.ts |
| `src/config/database.config.ts` | ts | no | DatabaseConfig, inferDbClient, getMikroOrmDriverClassForNest, getMikroOrmConfig |  |
| `src/data-maintenance/backup-secret.guard.ts` | ts | no | BackupSecretGuard |  |
| `src/data-maintenance/data-backup.service.ts` | ts | no | StoreSyncBackupPayload, DataBackupService | src/data-maintenance/entity-order.util.ts, src/entities/registry.ts |
| `src/data-maintenance/data-excel.service.ts` | ts | no | DataExcelService | src/entities/registry.ts, src/data-maintenance/data-backup.service.ts |
| `src/data-maintenance/data-maintenance.controller.ts` | ts | no | DataMaintenanceController | src/data-maintenance/backup-secret.guard.ts, src/data-maintenance/data-backup.service.ts, src/data-maintenance/data-excel.service.ts, src/auth/guards/permissions.guard.ts, src/auth/decorators/public.d |
| `src/data-maintenance/data-maintenance.module.ts` | ts | no | DataMaintenanceModule | src/auth/auth.module.ts, src/data-maintenance/backup-secret.guard.ts, src/data-maintenance/data-backup.service.ts, src/data-maintenance/data-excel.service.ts, src/data-maintenance/data-maintenance.con |
| `src/data-maintenance/entity-order.util.ts` | ts | no | sortEntityMetasForImport, reverseOrder |  |
| `src/entities/base.entity.ts` | ts | no |  |  |
| `src/entities/category.entity.ts` | ts | no | Category | src/entities/base.entity.ts |
| `src/entities/index.ts` | ts | no | Product, Category, User, Permission, Role, RolePermissionLink, UserRoleLink, Order, OrderStatus, PaymentMethod, PaymentStatus, PromoCode, PERSISTENT_ENTITY_CLASSES | src/entities/product.entity.ts, src/entities/category.entity.ts, src/entities/user.entity.ts, src/entities/permission.entity.ts, src/entities/role.entity.ts, src/entities/role-permission-link.entity.t |
| `src/entities/order.entity.ts` | ts | no | OrderStatus, PaymentMethod, PaymentStatus, OrderItem, Order | src/entities/base.entity.ts, src/entities/user.entity.ts |
| `src/entities/permission.entity.ts` | ts | no | Permission | src/entities/base.entity.ts, src/entities/role-permission-link.entity.ts |
| `src/entities/product.entity.ts` | ts | no | Product | src/entities/base.entity.ts |
| `src/entities/promo-code.entity.ts` | ts | no | PromoDiscountKind, PromoCode | src/entities/base.entity.ts |
| `src/entities/registry.ts` | ts | no | PERSISTENT_ENTITY_CLASSES | src/entities/category.entity.ts, src/entities/order.entity.ts, src/entities/promo-code.entity.ts, src/entities/permission.entity.ts, src/entities/product.entity.ts, src/entities/role.entity.ts, src/en |
| `src/entities/role-permission-link.entity.ts` | ts | no | RolePermissionLink | src/entities/base.entity.ts, src/entities/permission.entity.ts, src/entities/role.entity.ts |
| `src/entities/role.entity.ts` | ts | no | Role | src/entities/base.entity.ts, src/entities/role-permission-link.entity.ts, src/entities/user-role-link.entity.ts |
| `src/entities/user-role-link.entity.ts` | ts | no | UserRoleLink | src/entities/base.entity.ts, src/entities/role.entity.ts, src/entities/user.entity.ts |
| `src/entities/user.entity.ts` | ts | no | User | src/entities/base.entity.ts, src/entities/user-role-link.entity.ts |
| `src/main.ts` | ts | no |  | src/app.module.ts, src/common/logger |
| `src/migrations/Migration20260508180000.ts` | ts | no | Migration20260508180000 |  |
| `src/migrations/Migration20260508180500.ts` | ts | no | Migration20260508180500 |  |
| `src/migrations/Migration20260508190000.ts` | ts | no | Migration20260508190000 |  |
| `src/migrations/Migration20260508203000.ts` | ts | no | Migration20260508203000 |  |
| `src/migrations/Migration20260508204000.ts` | ts | no | Migration20260508204000 |  |
| `src/migrations/Migration20260510120000.ts` | ts | no | Migration20260510120000 | src/config/database.config.ts |
| `src/migrations/Migration20260511120000.ts` | ts | no | Migration20260511120000 | src/config/database.config.ts |
| `src/migrations/Migration20260511140000.ts` | ts | no | Migration20260511140000 | src/config/database.config.ts |
| `src/migrations/Migration20260511180000.ts` | ts | no | Migration20260511180000 | src/config/database.config.ts |
| `src/migrations/Migration20260511203000.ts` | ts | no | Migration20260511203000 | src/config/database.config.ts |
| `src/migrations/Migration20260512140000.ts` | ts | no | Migration20260512140000 | src/config/database.config.ts |
| `src/orders/orders.controller.ts` | ts | no | OrdersController | src/orders/orders.service.ts, src/entities, src/auth/guards/permissions.guard.ts, src/auth/decorators/public.decorator.ts, src/auth/permissions.constants.ts |
| `src/orders/orders.module.ts` | ts | no | OrdersModule | src/auth/auth.module.ts, src/users/users.module.ts, src/promo-codes/promo-codes.module.ts, src/entities, src/orders/orders.service.ts, src/orders/orders.controller.ts |
| `src/orders/orders.service.ts` | ts | no | CreateOrderItemDto, CreateOrderDto, OrdersService | src/entities, src/users/users.service.ts, src/promo-codes/promo-codes.service.ts |
| `src/products/products.controller.ts` | ts | no | ProductsController | src/products/products.service.ts, src/entities, src/auth/guards/permissions.guard.ts, src/auth/decorators/public.decorator.ts, src/auth/permissions.constants.ts |
| `src/products/products.module.ts` | ts | no | ProductsModule | src/auth/auth.module.ts, src/entities, src/products/products.service.ts, src/products/products.controller.ts |
| `src/products/products.service.ts` | ts | no | ProductListStockBand, ProductListOptions, AdjustStockDto, ProductsService | src/entities |
| `src/promo-codes/promo-codes.controller.ts` | ts | no | PromoCodesController | src/entities/promo-code.entity.ts, src/auth/guards/permissions.guard.ts, src/auth/decorators/public.decorator.ts, src/auth/permissions.constants.ts, src/promo-codes/promo-codes.dto.ts, src/promo-codes |
| `src/promo-codes/promo-codes.dto.ts` | ts | no | CreatePromoCodeDto, UpdatePromoCodeDto | src/entities/promo-code.entity.ts |
| `src/promo-codes/promo-codes.module.ts` | ts | no | PromoCodesModule | src/auth/auth.module.ts, src/entities/promo-code.entity.ts, src/promo-codes/promo-codes.controller.ts, src/promo-codes/promo-codes.service.ts |
| `src/promo-codes/promo-codes.service.ts` | ts | no | PromoCodesService | src/entities/promo-code.entity.ts, src/promo-codes/promo-codes.dto.ts |
| `src/rbac/rbac.controller.ts` | ts | no | RbacController | src/entities/permission.entity.ts, src/entities/role.entity.ts, src/auth/guards/permissions.guard.ts, src/auth/decorators/public.decorator.ts, src/auth/permissions.constants.ts |
| `src/rbac/rbac.module.ts` | ts | no | RbacModule | src/entities/permission.entity.ts, src/entities/role.entity.ts, src/auth/auth.module.ts, src/rbac/rbac.controller.ts |
| `src/users/users.controller.ts` | ts | no | PublicUser, LoginUser, UsersController | src/users/users.service.ts, src/entities/user.entity.ts, src/auth/guards/permissions.guard.ts, src/auth/decorators/public.decorator.ts, src/auth/permissions.constants.ts, src/auth/rbac.service.ts, src |
| `src/users/users.module.ts` | ts | no | UsersModule | src/auth/auth.module.ts, src/entities, src/users/users.service.ts, src/users/users.controller.ts |
| `src/users/users.service.ts` | ts | no | CreateUserDto, UpdateProfileDto, ChangePasswordDto, UsersService | src/entities/user.entity.ts, src/entities/role.entity.ts, src/entities/user-role-link.entity.ts, src/entities/order.entity.ts |
| `tsconfig.json` | config | — | — | — |

## Làm mới

- Cập nhật `context.json`: theo pipeline Graphify của app (vd. `update.cjs` / graphifyy).
- Sau đó chạy: `pnpm graphify:ai-summary`
