export interface DashboardOverviewDto {
  totalUsers: number;
  totalPosts: number;
  totalComments: number;
  totalCategories: number;
  totalTags: number;
  totalMessages: number;
  totalNotifications: number;
  totalContactRequests: number;
  totalStudents: number;
  totalSessions: number;
  totalRoles: number;
  usersChange: number;
  postsChange: number;
  commentsChange: number;
  categoriesChange: number;
  tagsChange: number;
  messagesChange: number;
  notificationsChange: number;
  contactRequestsChange: number;
  studentsChange: number;
  sessionsChange: number;
  rolesChange: number;
}

export interface DashboardMonthlyItemDto {
  month: string;
  users: number;
  posts: number;
  comments: number;
  categories: number;
  tags: number;
  messages: number;
  notifications: number;
  contactRequests: number;
  students: number;
  sessions: number;
  roles: number;
}

export interface DashboardCategoryItemDto {
  name: string;
  value: number;
  count: number;
  children?: DashboardCategoryItemDto[];
}

export interface DashboardTopPostDto {
  id: string;
  title: string;
  slug: string;
  comments: number;
}

export interface DashboardStatsDto {
  overview: DashboardOverviewDto;
  monthlyData: DashboardMonthlyItemDto[];
  categoryData: DashboardCategoryItemDto[];
  topPosts: DashboardTopPostDto[];
}
