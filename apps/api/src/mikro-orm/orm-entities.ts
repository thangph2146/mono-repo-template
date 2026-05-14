import { Account } from '../entities/account.entity';
import { AdmissionResult } from '../entities/admission-result.entity';
import { Category } from '../entities/category.entity';
import { Comment } from '../entities/comment.entity';
import { ContactRequest } from '../entities/contact-request.entity';
import { Group } from '../entities/group.entity';
import { GroupMember } from '../entities/group-member.entity';
import { Message } from '../entities/message.entity';
import { MessageRead } from '../entities/message-read.entity';
import { Notification } from '../entities/notification.entity';
import { PageContent } from '../entities/page-content.entity';
import { ParentStudent } from '../entities/parent-student.entity';
import { Post } from '../entities/post.entity';
import { PostCategory } from '../entities/post-category.entity';
import { PostTag } from '../entities/post-tag.entity';
import { Role } from '../entities/role.entity';
import { Session } from '../entities/session.entity';
import { Setting } from '../entities/setting.entity';
import { Student } from '../entities/student.entity';
import { Tag } from '../entities/tag.entity';
import { User } from '../entities/user.entity';
import { UserRole } from '../entities/user-role.entity';
import { VerificationToken } from '../entities/verification-token.entity';

export const ormEntities = [
  Account,
  AdmissionResult,
  Category,
  Comment,
  ContactRequest,
  Group,
  GroupMember,
  Message,
  MessageRead,
  Notification,
  PageContent,
  ParentStudent,
  Post,
  PostCategory,
  PostTag,
  Role,
  Session,
  Setting,
  Student,
  Tag,
  User,
  UserRole,
  VerificationToken,
] as const;
