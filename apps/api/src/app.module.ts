import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { DatabaseModule } from './mikro-orm/mikro-orm.module';
import { PublicModule } from './public/public.module';
import { SocketModule } from './socket/socket.module';
import { AuthModule } from './auth/auth.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AccountsModule } from './accounts/accounts.module';
import { SessionsModule } from './sessions/sessions.module';
import { UploadsModule } from './uploads/uploads.module';
import { ContactRequestsModule } from './contact-requests/contact-requests.module';
import { CommentsModule } from './comments/comments.module';
import { CategoriesModule } from './categories/categories.module';
import { TagsModule } from './tags/tags.module';
import { PostsModule } from './posts/posts.module';
import { RolesModule } from './roles/roles.module';
import { StudentsModule } from './students/students.module';
import { AdmissionResultsModule } from './admission-results/admission-results.module';
import { UsersModule } from './users/users.module';
import { ProxyImageModule } from './proxy-image/proxy-image.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { MessagesModule } from './messages/messages.module';
import { GroupsModule } from './groups/groups.module';
import { PageContentsModule } from './page-contents/page-contents.module';
import { SettingsModule } from './settings/settings.module';
import { SystemModule } from './system/system.module';
import { ParentStudentsModule } from './parent-students/parent-students.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    DatabaseModule,
    PublicModule,
    SocketModule,
    AuthModule,
    NotificationsModule,
    AccountsModule,
    SessionsModule,
    UploadsModule,
    ContactRequestsModule,
    CommentsModule,
    CategoriesModule,
    TagsModule,
    PostsModule,
    RolesModule,
    StudentsModule,
    AdmissionResultsModule,
    UsersModule,
    ProxyImageModule,
    DashboardModule,
    MessagesModule,
    GroupsModule,
    PageContentsModule,
    SettingsModule,
    SystemModule,
    ParentStudentsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
