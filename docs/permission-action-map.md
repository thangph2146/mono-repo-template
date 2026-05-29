# Permission-Action Map

> Tài liệu này ánh xạ từng action/hành vi trong hệ thống tới permission string tương ứng.
> Dùng để:
> - Đảm bảo role chỉ có permission cần thiết cho action được phép
> - Kiểm tra tính đầy đủ khi thêm page/feature mới
> - Đồng bộ giữa API (`apps/api/src/config/permissions.ts`) và frontend (`packages/api-client/src/permissions.ts`)

---

## 1. Quy tắc đặt tên

- Format: `resource:action` (vd: `posts:view`, `users:manage`)
- `resource` = danh từ số nhiều, snake_case (vd: `contact_requests`, `admission_results`)
- `action` = động từ, snake_case (vd: `view_own`, `hard_delete`)
- `MANAGE` là action tổng hợp = tất cả quyền trên resource đó

---

## 2. Danh sách Permission đầy đủ (API — `apps/api/src/config/permissions.ts`)

### Dashboard
| Permission string | API constant | Gán cho role |
|---|---|---|
| `dashboard:view` | `DASHBOARD_VIEW` | all roles |

### Users
| Permission string | API constant | Ý nghĩa |
|---|---|---|
| `users:view` | `USERS_VIEW` | Xem danh sách/chi tiết user |
| `users:create` | `USERS_CREATE` | Tạo user mới |
| `users:update` | `USERS_UPDATE` | Sửa user |
| `users:delete` | `USERS_DELETE` | Xóa user |
| `users:manage` | `USERS_MANAGE` | Toàn quyền user (view+create+update+delete+export) |
| `users:export` | `USERS_EXPORT` | Export user |
| `users:import` | `USERS_IMPORT` | Import user từ file |
| `users:restore` | `USERS_RESTORE` | Khôi phục user đã xóa |
| `users:hard-delete` | `USERS_HARD_DELETE` | Xóa vĩnh viễn user |
| `users:active` | `USERS_ACTIVE` | Kích hoạt user |
| `users:unactive` | `USERS_UNACTIVE` | Vô hiệu hóa user |

### Posts
| Permission string | API constant | Ý nghĩa |
|---|---|---|
| `posts:view` | `POSTS_VIEW` | Xem bài viết (công khai + admin) |
| `posts:view_all` | `POSTS_VIEW_ALL` | Xem tất cả bài viết (kể cả của người khác) |
| `posts:view_own` | `POSTS_VIEW_OWN` | Xem bài viết của mình |
| `posts:create` | `POSTS_CREATE` | Tạo bài viết |
| `posts:update` | `POSTS_UPDATE` | Sửa bài viết |
| `posts:delete` | `POSTS_DELETE` | Xóa bài viết (vào thùng rác) |
| `posts:manage` | `POSTS_MANAGE` | Toàn quyền bài viết |
| `posts:export` | `POSTS_EXPORT` | Export bài viết |
| `posts:publish` | `POSTS_PUBLISH` | Đăng/Duyệt bài viết |
| `posts:import` | `POSTS_IMPORT` | Import bài viết |
| `posts:restore` | `POSTS_RESTORE` | Khôi phục bài viết từ thùng rác |

### Categories
| Permission string | API constant | Ý nghĩa |
|---|---|---|
| `categories:view` | `CATEGORIES_VIEW` | Xem danh mục |
| `categories:create` | `CATEGORIES_CREATE` | Tạo danh mục |
| `categories:update` | `CATEGORIES_UPDATE` | Sửa danh mục |
| `categories:delete` | `CATEGORIES_DELETE` | Xóa danh mục |
| `categories:manage` | `CATEGORIES_MANAGE` | Toàn quyền danh mục |
| `categories:export` | `CATEGORIES_EXPORT` | Export danh mục |

### Tags
| Permission string | API constant | Ý nghĩa |
|---|---|---|
| `tags:view` | `TAGS_VIEW` | Xem tags |
| `tags:create` | `TAGS_CREATE` | Tạo tag |
| `tags:update` | `TAGS_UPDATE` | Sửa tag |
| `tags:delete` | `TAGS_DELETE` | Xóa tag |
| `tags:manage` | `TAGS_MANAGE` | Toàn quyền tags |
| `tags:export` | `TAGS_EXPORT` | Export tags |

### Comments
| Permission string | API constant | Ý nghĩa |
|---|---|---|
| `comments:view` | `COMMENTS_VIEW` | Xem bình luận |
| `comments:create` | `COMMENTS_CREATE` | Tạo bình luận |
| `comments:update` | `COMMENTS_UPDATE` | Sửa bình luận |
| `comments:delete` | `COMMENTS_DELETE` | Xóa bình luận |
| `comments:manage` | `COMMENTS_MANAGE` | Toàn quyền bình luận |
| `comments:export` | `COMMENTS_EXPORT` | Export bình luận |
| `comments:approve` | `COMMENTS_APPROVE` | Duyệt bình luận |
| `comments:restore` | `COMMENTS_RESTORE` | Khôi phục bình luận |

### Roles
| Permission string | API constant | Ý nghĩa |
|---|---|---|
| `roles:view` | `ROLES_VIEW` | Xem roles |
| `roles:create` | `ROLES_CREATE` | Tạo role |  
| `roles:update` | `ROLES_UPDATE` | Sửa role |
| `roles:delete` | `ROLES_DELETE` | Xóa role |
| `roles:manage` | `ROLES_MANAGE` | Toàn quyền roles |
| `roles:export` | `ROLES_EXPORT` | Export roles |

### Messages
| Permission string | API constant | Ý nghĩa |
|---|---|---|
| `messages:view` | `MESSAGES_VIEW` | Xem tin nhắn |
| `messages:view_own` | — | Xem tin nhắn của mình |
| `messages:create` | `MESSAGES_CREATE` | Gửi tin nhắn |
| `messages:update` | `MESSAGES_UPDATE` | Sửa tin nhắn |
| `messages:delete` | `MESSAGES_DELETE` | Xóa tin nhắn |
| `messages:manage` | `MESSAGES_MANAGE` | Toàn quyền tin nhắn |
| `messages:export` | `MESSAGES_EXPORT` | Export tin nhắn |

### Notifications
| Permission string | API constant | Ý nghĩa |
|---|---|---|
| `notifications:view` | `NOTIFICATIONS_VIEW` | Xem thông báo |
| `notifications:view_all` | `NOTIFICATIONS_VIEW_ALL` | Xem tất cả thông báo |
| `notifications:view_own` | `NOTIFICATIONS_VIEW_OWN` | Xem thông báo của mình |
| `notifications:manage` | `NOTIFICATIONS_MANAGE` | Toàn quyền thông báo |
| `notifications:export` | `NOTIFICATIONS_EXPORT` | Export thông báo |

### Contact Requests
| Permission string | API constant | Ý nghĩa |
|---|---|---|
| `contact_requests:view` | `CONTACT_REQUESTS_VIEW` | Xem yêu cầu liên hệ |
| `contact_requests:create` | `CONTACT_REQUESTS_CREATE` | Tạo yêu cầu |
| `contact_requests:update` | `CONTACT_REQUESTS_UPDATE` | Sửa yêu cầu |
| `contact_requests:delete` | `CONTACT_REQUESTS_DELETE` | Xóa yêu cầu |
| `contact_requests:manage` | `CONTACT_REQUESTS_MANAGE` | Toàn quyền |
| `contact_requests:export` | `CONTACT_REQUESTS_EXPORT` | Export |
| `contact_requests:assign` | `CONTACT_REQUESTS_ASSIGN` | Gán yêu cầu cho người xử lý |
| `contact_requests:restore` | `CONTACT_REQUESTS_RESTORE` | Khôi phục yêu cầu |

### Students
| Permission string | API constant | Ý nghĩa |
|---|---|---|
| `students:view` | `STUDENTS_VIEW` | Xem danh sách sinh viên |
| `students:view_all` | `STUDENTS_VIEW_ALL` | Xem tất cả sinh viên |
| `students:view_own` | `STUDENTS_VIEW_OWN` | Xem thông tin sinh viên của mình |
| `students:create` | `STUDENTS_CREATE` | Tạo sinh viên |
| `students:update` | `STUDENTS_UPDATE` | Sửa sinh viên |
| `students:delete` | `STUDENTS_DELETE` | Xóa sinh viên |
| `students:manage` | `STUDENTS_MANAGE` | Toàn quyền sinh viên |
| `students:export` | `STUDENTS_EXPORT` | Export |
| `students:active` | `STUDENTS_ACTIVE` | Kích hoạt |
| `students:import` | `STUDENTS_IMPORT` | Import |
| `students:restore` | `STUDENTS_RESTORE` | Khôi phục |

### Sessions
| Permission string | API constant | Ý nghĩa |
|---|---|---|
| `sessions:view` | `SESSIONS_VIEW` | Xem phiên đăng nhập |
| `sessions:create` | `SESSIONS_CREATE` | Tạo phiên |
| `sessions:update` | `SESSIONS_UPDATE` | Sửa phiên |
| `sessions:delete` | `SESSIONS_DELETE` | Xóa phiên |
| `sessions:manage` | `SESSIONS_MANAGE` | Toàn quyền |
| `sessions:export` | `SESSIONS_EXPORT` | Export |
| `sessions:restore` | `SESSIONS_RESTORE` | Khôi phục |
| `sessions:revoke-by-user` | — | Thu hồi phiên theo user |

### Settings
| Permission string | API constant | Ý nghĩa |
|---|---|---|
| `settings:view` | `SETTINGS_VIEW` | Xem cài đặt |
| `settings:create` | `SETTINGS_CREATE` | Tạo cài đặt |
| `settings:update` | `SETTINGS_UPDATE` | Sửa cài đặt |
| `settings:delete` | `SETTINGS_DELETE` | Xóa cài đặt |
| `settings:manage` | `SETTINGS_MANAGE` | Toàn quyền cài đặt |
| `settings:export` | `SETTINGS_EXPORT` | Export |
| `settings:import` | `SETTINGS_IMPORT` | Import |

### Accounts (profile cá nhân)
| Permission string | API constant | Ý nghĩa |
|---|---|---|
| `accounts:view` | `ACCOUNTS_VIEW` | Xem thông tin tài khoản cá nhân |
| `accounts:update` | `ACCOUNTS_UPDATE` | Cập nhật thông tin cá nhân |
| `accounts:manage` | `ACCOUNTS_MANAGE` | Toàn quyền tài khoản |

### Uploads
| Permission string | API constant | Ý nghĩa |
|---|---|---|
| `uploads:view` | `UPLOADS_VIEW` | Xem file upload |
| `uploads:create` | `UPLOADS_CREATE` | Upload file |
| `uploads:update` | `UPLOADS_UPDATE` | Sửa file |
| `uploads:delete` | `UPLOADS_DELETE` | Xóa file |
| `uploads:manage` | `UPLOADS_MANAGE` | Toàn quyền |
| `uploads:export` | `UPLOADS_EXPORT` | Export |

### Admission Results
| Permission string | API constant | Ý nghĩa |
|---|---|---|
| `admission_results:view` | `ADMISSION_RESULTS_VIEW` | Xem kết quả tuyển sinh |
| `admission_results:create` | `ADMISSION_RESULTS_CREATE` | Tạo kết quả |
| `admission_results:update` | `ADMISSION_RESULTS_UPDATE` | Sửa kết quả |
| `admission_results:delete` | `ADMISSION_RESULTS_DELETE` | Xóa kết quả |
| `admission_results:manage` | `ADMISSION_RESULTS_MANAGE` | Toàn quyền |
| `admission_results:export` | `ADMISSION_RESULTS_EXPORT` | Export |
| `admission_results:import` | `ADMISSION_RESULTS_IMPORT` | Import |
| `admission_results:restore` | `ADMISSION_RESULTS_RESTORE` | Khôi phục |

### Page Contents
| Permission string | API constant | Ý nghĩa |
|---|---|---|
| `page_contents:view` | `PAGE_CONTENTS_VIEW` | Xem nội dung trang |
| `page_contents:create` | `PAGE_CONTENTS_CREATE` | Tạo nội dung trang |
| `page_contents:update` | `PAGE_CONTENTS_UPDATE` | Sửa nội dung trang |
| `page_contents:delete` | `PAGE_CONTENTS_DELETE` | Xóa nội dung trang |
| `page_contents:manage` | `PAGE_CONTENTS_MANAGE` | Toàn quyền |
| `page_contents:export` | `PAGE_CONTENTS_EXPORT` | Export |

---

## 3. Mapping Admin Pages → Permission

### 3.1. Sidebar Menu → Required Permission

| Route | Label | Permission check | Ghi chú |
|---|---|---|---|
| `/` | Tổng quan | (public) | Ai cũng vào được |
| `/my-students` | Sinh viên (cá nhân) | `students:view_own` | Sinh viên xem thông tin của mình |
| `/parent-students` | Duyệt sinh viên | `users:manage` | Admin duyệt |
| `/contact-requests` | Liên hệ hỗ trợ | `contact_requests:view` | |
| `/categories` | Danh mục | `categories:view` | |
| `/tags` | Tags | `tags:view` | |
| `/guides` | Hướng dẫn sử dụng | `page_contents:view` | |
| `/posts` | Bài viết | `posts:view` | |
| `/posts/new` | Thêm bài viết | `posts:create` | |
| `/posts/[id]` | Chi tiết bài viết | `posts:view` | |
| `/posts/[id]/edit` | Sửa bài viết | `posts:update` | |
| `/staff` | Nhân sự | `users:manage` | |
| `/rbac` | Phân quyền | `roles:view` (hiện đang dùng `rbac.read`) | |
| `/events` | Sự kiện | `events:view` | |
| `/cameras` | Camera | `cameras:view` | |
| `/templates` | Mẫu hiển thị | `templates:view` | |
| `/screens` | Màn hình | `screens:view` | |
| `/departments` | Phòng khoa | `departments:view` | |
| `/speakers` | Diễn giả | `speakers:view` | |
| `/locations` | Địa điểm | `locations:view` | |
| `/training-levels` | Bậc học | `training_levels:view` | |
| `/training-systems` | Hệ đào tạo | `training_systems:view` | |
| `/majors` | Ngành học | `majors:view` | |
| `/courses` | Khóa học | `courses:view` | |
| `/academic-years` | Niên khóa | `academic_years:view` | |
| `/data` | Sao lưu dữ liệu | `settings:manage` | |
| `/database-schema` | Quan hệ CSDL | (super_admin/admin) | |
| `/graph` | Kiến trúc hệ thống | (super_admin/admin) | |
| `/profile` | Thông tin cá nhân | `accounts:view` | |
| `/settings` | Cài đặt hệ thống | `settings:view` | |

### 3.2. API Endpoints → Required Permission

| Method | Endpoint | Permission cần | Controller |
|---|---|---|---|
| GET | `/admin/dashboard/*` | `dashboard:view` | DashboardController |
| GET/POST/PUT/DELETE | `/admin/users/*` | `users:*` | UsersController |
| GET/POST/PUT/DELETE | `/admin/posts/*` | `posts:*` | PostsController |
| GET/POST/PUT/DELETE | `/admin/categories/*` | `categories:*` | CategoriesController |
| GET/POST/PUT/DELETE | `/admin/tags/*` | `tags:*` | TagsController |
| GET/POST/PUT/DELETE | `/admin/roles/*` | `roles:*` | RolesController |
| GET/POST/PUT/DELETE | `/admin/contact-requests/*` | `contact_requests:*` | ContactRequestsController |
| GET/POST/PUT/DELETE | `/admin/students/*` | `students:*` | StudentsController |
| GET/POST/PUT/DELETE | `/admin/sessions/*` | `sessions:*` | SessionsController |
| GET/POST/PUT/DELETE | `/admin/settings/*` | `settings:*` | SettingsController |
| GET/PUT | `/admin/accounts/*` | `accounts:*` | AccountsController |
| GET/POST/PUT/DELETE | `/admin/page-contents/*` | `page_contents:*` (đã enforce) | PageContentsController |
| GET/POST | `/admin/system/*` | `settings:manage` hoặc `settings:import` (đã enforce) | SystemController |
| GET/POST/PUT/DELETE | `/admin/admission-results/*` | `admission_results:*` | AdmissionResultsController |
| GET/POST/PUT/DELETE | `/admin/events/*` | `events:*` | EventsController |
| GET/POST/PUT/DELETE | `/admin/cameras/*` | `cameras:*` | CamerasController |
| GET/POST/PUT/DELETE | `/admin/templates/*` | `templates:*` | TemplatesController |
| GET/POST/PUT/DELETE | `/admin/screens/*` | `screens:*` | ScreensController |
| GET/POST/PUT/DELETE | `/admin/departments/*` | `departments:*` | DepartmentsController |
| GET/POST/PUT/DELETE | `/admin/speakers/*` | `speakers:*` | SpeakersController |
| GET/POST/PUT/DELETE | `/admin/locations/*` | `locations:*` | LocationsController |
| GET/POST/PUT/DELETE | `/admin/training-levels/*` | `training_levels:*` | TrainingLevelsController |
| GET/POST/PUT/DELETE | `/admin/training-systems/*` | `training_systems:*` | TrainingSystemsController |
| GET/POST/PUT/DELETE | `/admin/majors/*` | `majors:*` | MajorsController |
| GET/POST/PUT/DELETE | `/admin/courses/*` | `courses:*` | CoursesController |
| GET/POST/PUT/DELETE | `/admin/academic-years/*` | `academic_years:*` | AcademicYearsController |
| GET/POST/PUT/DELETE | `/admin/event-registrations/*` | `event_registrations:*` | EventRegistrationsController |
| GET/POST/PUT/DELETE | `/admin/event-checkins/*` | `event_checkins:*` | EventCheckinsController |
| GET/POST/PUT/DELETE | `/admin/event-speakers/*` | `event_speakers:*` | EventSpeakersController |
| GET/POST/PUT/DELETE | `/admin/face-data/*` | `face_data:*` | FaceDataController |
| GET/POST/PUT/DELETE | `/admin/uploads/*` | `uploads:*` | UploadsController |
| GET/POST/PUT/DELETE | `/admin/comments/*` | `comments:*` | CommentsController |
| GET/POST/PUT/DELETE | `/admin/messages/*` | `messages:*` | MessagesController |
| GET/POST/PUT/DELETE | `/admin/groups/*` | `groups:*` | GroupsController |
| GET/POST/PUT/DELETE | `/admin/notifications/*` | `notifications:*` | NotificationsController |
| GET/POST/PUT/DELETE | `/admin/parent-students/*` | `students:*` | ParentStudentsController |

---

## 4. Seed Role Permissions (Hiện tại)

### super_admin
Toàn bộ ~123 permissions. Xem chi tiết trong `apps/api/src/seeds/superadmin-bootstrap.data.ts`.

### admin
~62 permissions. Thiếu so với super_admin: `users:active`, `users:hard-delete`, `users:import`, `users:restore`, `users:unactive`, `comments:*`, `tags:*`, `messages:*`, `students:*`, `admission_results:import/restore`, `sessions:revoke-by-user`.

### editor (33 permissions)
- `dashboard:view`
- `accounts:view`, `accounts:update`, `accounts:manage`
- `posts:*` (view, create, update, delete, manage, export, view_all, view_own, publish, import, restore)
- `uploads:*` (view, create, update, delete, manage, export)
- `categories:*` (view, create, update, delete, manage, export)
- `tags:*` (view, create, update, delete, manage, export)
- `contact_requests:*` (view, create, update, delete, manage, export, assign, restore)
- `page_contents:*` (view, create, update, delete, manage, export)

### user
- `permissions: null` — không có quyền gì

### student (7 permissions)
- `dashboard:view`
- `students:view_own`
- `notifications:view_own`
- `messages:view_own`
- `posts:view`
- `accounts:view`
- `accounts:update`

---

## 5. Diff: API Permissions vs Frontend PERMISSION_CODES

### 5.1. API permissions KHÔNG có trong frontend (cần thêm)

Những permission này tồn tại trong `apps/api/src/config/permissions.ts` NHƯNG chưa có trong `packages/api-client/src/permissions.ts`:

- `users:view`, `users:create`, `users:update`, `users:delete`
- `users:import`, `users:restore`, `users:hard-delete`, `users:active`, `users:unactive`
- `posts:create`, `posts:update`, `posts:delete`, `posts:manage`, `posts:export`
- `posts:view_all`, `posts:view_own`, `posts:publish`, `posts:import`, `posts:restore`
- `categories:create`, `categories:update`, `categories:delete`, `categories:manage`, `categories:export`
- `tags:create`, `tags:update`, `tags:delete` (đã có view/manage/export)
- `comments:*` (tất cả 8 permissions)
- `roles:*` (tất cả 6 permissions)
- `messages:*` (tất cả 8 permissions, chỉ có `view_own`)
- `notifications:*` (chỉ có `view_own`, thiếu view/manage/export/view_all)
- `students:*` (chỉ có `view_own`, thiếu 10 permissions còn lại)
- `sessions:*` (tất cả 7 permissions)
- `settings:*` (tất cả 7 permissions)
- `accounts:*` (thiếu `accounts:manage`)
- `uploads:*` (tất cả 6 permissions)
- `admission_results:*` (tất cả 8 permissions)
- `dashboard:view` (đã thêm gần đây)
- `groups:*` (tất cả 6 permissions)

### 5.2. Frontend permissions KHÔNG tồn tại trong API

Những permission này có trong `packages/api-client/src/permissions.ts` NHƯNG không có trong API:

- `products.read`, `products.write`, `orders.read`, `orders.write`, `orders.checkout`
- `users.cart_own`
- `rbac.read`, `data.maintenance`
- `support.read`, `support.write`
- `speakers:*`, `locations:*`, `events:*`, `cameras:*`, `templates:*`, `screens:*`, `departments:*`
- `training_levels:*`, `training_systems:*`, `majors:*`, `courses:*`, `academic_years:*`
- `event_registrations:*`, `event_checkins:*`, `event_speakers:*`
- `face_data:*`
- `categories.read`, `categories.write` (nên đổi thành `categories:view`, `categories:create`)

### 5.3. Cần đồng bộ

Frontend `PERMISSION_CODES` cần:
1. Thêm tất cả permission từ API chưa có
2. Chuẩn hóa tên theo format `RESOURCE_ACTION` (khớp API constant)
3. Giữ lại các code đặc thù frontend (như `speakers:*`, `events:*`, etc.) nhưng thêm cả API counterparts
4. Đổi `categories.read` → `categories:view`, `categories.write` → `categories:create` (nếu có thể)

---

## 6. UI Permission Gating Tracking

> Trạng thái gán permission vào UI action buttons cho từng page.
> ✅ = đã làm, 🟡 = cần làm, ⬜ = chưa áp dụng

### List Pages — Toolbar & Per-row Actions

| Page | PageGuard | Toolbar Add | Per-row Sửa | Per-row Xóa | Export | Bulk Actions | Trash Tab/Row | Detail Edit btn |
|---|---|---|---|---|---|---|---|---|
| **posts** | `permission=posts:view` | ✅ `posts:create` | ✅ `posts:update` | ✅ `posts:delete` | ✅ `posts:export` | ✅ `posts:delete` | ✅ `posts:restore` | ✅ `posts:update` |
| **academic-years** | `roles=[...]` | ✅ `canWrite` | ✅ `canWrite` | ✅ `canWrite` | N/A | ✅ `canWrite` | ✅ `canWrite` | ✅ `ACADEMIC_YEARS_UPDATE` |
| **courses** | `roles=[...]` | ✅ `canWrite` | ✅ `canWrite` | ✅ `canWrite` | N/A | ✅ `canWrite` | ✅ `canWrite` | ✅ `COURSES_UPDATE` |
| **departments** | `roles=[...]` | ✅ `canWrite` | ✅ `canWrite` | ✅ `canWrite` | N/A | ✅ `canWrite` | ✅ `canWrite` | ✅ `DEPARTMENTS_UPDATE` |
| **events** | `roles=[...]` | ✅ `canWrite` | ✅ `canWrite` | ✅ `canWrite` | N/A | ✅ `canWrite` | ✅ `canWrite` | ✅ `EVENTS_UPDATE` |
| **locations** | `roles=[...]` | ✅ `canWrite` | ✅ `canWrite` | ✅ `canWrite` | N/A | ✅ `canWrite` | ✅ `canWrite` | ✅ `LOCATIONS_UPDATE` |
| **majors** | `roles=[...]` | ✅ `canWrite` | ✅ `canWrite` | ✅ `canWrite` | N/A | ✅ `canWrite` | ✅ `canWrite` | ✅ `MAJORS_UPDATE` |
| **speakers** | `roles=[...]` | ✅ `canWrite` | ✅ `canWrite` | ✅ `canWrite` | N/A | ✅ `canWrite` | ✅ `canWrite` | ✅ `SPEAKERS_UPDATE` |
| **training-levels** | `roles=[...]` | ✅ `canWrite` | ✅ `canWrite` | ✅ `canWrite` | N/A | ✅ `canWrite` | ✅ `canWrite` | ✅ `TRAINING_LEVELS_UPDATE` |
| **training-systems** | `roles=[...]` | ✅ `canWrite` | ✅ `canWrite` | ✅ `canWrite` | N/A | ✅ `canWrite` | ✅ `canWrite` | ✅ `TRAINING_SYSTEMS_UPDATE` |
| **templates** | `roles=[...]` | ✅ `canWrite` | ✅ `canWrite` | ✅ `canWrite` | N/A | ✅ `canWrite` | ✅ `canWrite` | ✅ `TEMPLATES_UPDATE` |
| **screens** | `roles=[...]` | ✅ `canWrite` | ✅ `canWrite` | ✅ `canWrite` | N/A | ✅ `canWrite` | ✅ `canWrite` | ✅ `SCREENS_UPDATE` |
| **cameras** | `roles=[...]` | ✅ `canWrite` | ✅ `canWrite` | ✅ `canWrite` | N/A | ✅ `canWrite` | ✅ `canWrite` | ✅ `CAMERAS_UPDATE` |
| **categories** | `roles=[...]` | ✅ `canWrite` | ✅ `canWrite` | ✅ `canWrite` | N/A | ✅ `canWrite` | ✅ `canWrite` | ✅ `CATEGORIES_UPDATE` |
| **tags** | `roles=[...]` | ✅ `canWrite` | ✅ `canWrite` | ✅ `canWrite` | N/A | ✅ `canWrite` | ✅ `canWrite` | ✅ `TAGS_UPDATE` |
| **contact-requests** | `roles=[...]` | N/A | ✅ `CONTACT_REQUESTS_UPDATE` | ✅ `CONTACT_REQUESTS_DELETE` | N/A | ✅ `CONTACT_REQUESTS_DELETE` | ✅ `CONTACT_REQUESTS_RESTORE` | ✅ `CONTACT_REQUESTS_UPDATE` |
| **guides** | `permission=page_contents:view` | ✅ `PAGE_CONTENTS_CREATE` | ✅ `PAGE_CONTENTS_UPDATE` | ✅ `PAGE_CONTENTS_DELETE` | N/A | N/A | N/A | ✅ `PAGE_CONTENTS_UPDATE` |
| **staff** | `roles=[...]` | 🟡 `users:create` | 🟡 `users:update` | 🟡 `users:delete` | N/A | 🟡 | 🟡 | ✅ `USERS_MANAGE` |
| **my-students** | ❌ không có guard | ✅ `STUDENTS_CREATE` | N/A | ✅ `STUDENTS_DELETE` | N/A | N/A | N/A | N/A |
| **parent-students** | `roles=[...]` | N/A | N/A | N/A | N/A | ✅ `STUDENTS_UPDATE` | N/A | N/A |
| **data** | `roles=[...]` | N/A | N/A | N/A | ✅ `settings:export` | N/A | N/A | N/A |
| **dashboard** | không có guard | N/A | N/A | N/A | N/A | N/A | N/A | ✅ (quick links gated) |

### Detail / New / Edit Pages

| Page | Chỉnh sửa button | Form submit (new) | Form submit (edit) |
|---|---|---|---|
| **posts** | ✅ `posts:update` | ✅ role-gated | ✅ role-gated |
| **academic-years** | ✅ `ACADEMIC_YEARS_UPDATE` | ⬜ | ⬜ |
| **courses** | ✅ `COURSES_UPDATE` | ⬜ | ⬜ |
| **departments** | ✅ `DEPARTMENTS_UPDATE` | ⬜ | ⬜ |
| **events** | ✅ `EVENTS_UPDATE` | ⬜ | ⬜ |
| **locations** | ✅ `LOCATIONS_UPDATE` | ⬜ | ⬜ |
| **majors** | ✅ `MAJORS_UPDATE` | ⬜ | ⬜ |
| **speakers** | ✅ `SPEAKERS_UPDATE` | ⬜ | ⬜ |
| **training-levels** | ✅ `TRAINING_LEVELS_UPDATE` | ⬜ | ⬜ |
| **training-systems** | ✅ `TRAINING_SYSTEMS_UPDATE` | ⬜ | ⬜ |
| **templates** | ✅ `TEMPLATES_UPDATE` | ⬜ | ⬜ |
| **screens** | ✅ `SCREENS_UPDATE` | ⬜ | ⬜ |
| **cameras** | ✅ `CAMERAS_UPDATE` | ⬜ | ⬜ |
| **categories** | ✅ `CATEGORIES_UPDATE` | ⬜ | ⬜ |
| **tags** | ✅ `TAGS_UPDATE` | ⬜ | ⬜ |
| **contact-requests** | ✅ `CONTACT_REQUESTS_UPDATE` | ⬜ | ⬜ |
| **guides** | ✅ `PAGE_CONTENTS_UPDATE` | ✅ `page_contents:create` | ✅ `page_contents:update` |
| **staff** | ✅ `USERS_MANAGE` | ✅ `USERS_MANAGE` | ✅ `USERS_MANAGE` |

### Ghi chú
- `canWrite` = `RESOURCE_MANAGE \|\| RESOURCE_CREATE \|\| RESOURCE_UPDATE` (kiểm tra tổng hợp)
- `roles=[...]` = `AdminPageGuard roles={["super_admin","admin","manager"]}` (hoặc subset)
- N/A = không có action này trên page
- 🟡 = cần gắn permission vào UI action
- ⬜ = chưa kiểm tra / không áp dụng

---

## 7. Checklist khi thêm page/feature mới

- [ ] Thêm permission string vào `apps/api/src/config/permissions.ts`
- [ ] Thêm hằng số vào `PERMISSION_CODES` trong `packages/api-client/src/permissions.ts`
- [ ] Thêm guard trên page: `AdminPageGuard permission={PERMISSION_CODES.XXX}`
- [ ] Cập nhật sidebar menu với permission check
- [ ] (Tương lai) Thêm `@Permissions()` decorator trên API endpoint
- [ ] Cập nhật seed data cho role(s) cần quyền này
- [ ] Cập nhật file này
