import { AcademicYear } from '../entities/academic-year.entity';
import { Account } from '../entities/account.entity';
import { AdmissionResult } from '../entities/admission-result.entity';
import { Category } from '../entities/category.entity';
import { Comment } from '../entities/comment.entity';
import { ContactRequest } from '../entities/contact-request.entity';
import { Course } from '../entities/course.entity';
import { Group } from '../entities/group.entity';
import { GroupMember } from '../entities/group-member.entity';
import { ImportedUser } from '../entities/imported-user.entity';
import { Location } from '../entities/location.entity';
import { Major } from '../entities/major.entity';
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
import { Speaker } from '../entities/speaker.entity';
import { Student } from '../entities/student.entity';
import { Tag } from '../entities/tag.entity';
import { TrainingLevel } from '../entities/training-level.entity';
import { TrainingSystem } from '../entities/training-system.entity';
import { User } from '../entities/user.entity';
import { UserRole } from '../entities/user-role.entity';
import { VerificationToken } from '../entities/verification-token.entity';

export const ormEntities = [
  AcademicYear,
  Account,
  AdmissionResult,
  Category,
  Comment,
  ContactRequest,
  Course,
  Group,
  GroupMember,
  ImportedUser,
  Location,
  Major,
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
  Speaker,
  Student,
  Tag,
  TrainingLevel,
  TrainingSystem,
  User,
  UserRole,
  VerificationToken,
] as const;
