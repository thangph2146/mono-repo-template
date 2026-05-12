# HUB API (`apps/api`) — Domain Summary for AI

> API này thuộc hệ thống HUB (kết nối phụ huynh - nhà trường), **không phải ecommerce**.
> Mục tiêu chính: tin tức, học vụ, thông báo, tài khoản, trao đổi và nội dung hỗ trợ.

## Core Domain

- Tin tức và nội dung: `posts`, `categories`, `tags`, `comments`, `page-contents`
- Học vụ sinh viên: `students`, `admission-results`
- Giao tiếp và hỗ trợ: `messages`, `groups`, `contact-requests`, `notifications`
- Hệ thống người dùng: `users`, `roles`, `accounts`, `sessions`, `auth`
- Vận hành: `uploads`, `settings`, `dashboard`, `system`, `public`, `socket`

## Root Module

`src/app.module.ts` đang import các module theo domain HUB:

- `PublicModule`, `SocketModule`, `AuthModule`
- `NotificationsModule`, `AccountsModule`, `SessionsModule`
- `UploadsModule`, `ContactRequestsModule`
- `CommentsModule`, `CategoriesModule`, `TagsModule`, `PostsModule`
- `RolesModule`, `StudentsModule`, `AdmissionResultsModule`, `UsersModule`
- `ProxyImageModule`, `DashboardModule`, `MessagesModule`, `GroupsModule`
- `PageContentsModule`, `SettingsModule`, `SystemModule`

## ORM Entity Set

Tập entity runtime lấy từ `src/mikro-orm/orm-entities.ts`, bao gồm:

- `Account`, `AdmissionResult`, `Category`, `Comment`, `ContactRequest`
- `Group`, `GroupMember`, `Message`, `MessageRead`, `Notification`
- `PageContent`, `Post`, `PostCategory`, `PostTag`
- `Role`, `Session`, `Setting`, `Student`, `Tag`
- `User`, `UserRole`, `VerificationToken`

## AI Guardrail

- Khi sinh code cho `apps/api`, ưu tiên ngữ cảnh HUB (phụ huynh - nhà trường).
- Không tạo mới nghiệp vụ thương mại điện tử như giỏ hàng, đơn hàng, thanh toán, khuyến mãi.
- Nếu cần migration domain, bám theo entity/module hiện có thay vì template cũ.
