import { ApiClient, type ApiClientOptions } from './client';
import { CategoriesApi } from './resources/categories';
import { GuidesApi } from './resources/guides';
import { PostsApi } from './resources/posts';
import { RbacApi } from './resources/rbac';
import { TagsApi } from './resources/tags';
import { UsersApi } from './resources/users';
import { ContactRequestsApi } from './resources/contact-requests';
import { MyStudentsApi } from './resources/my-students';
import { ParentStudentsApi } from './resources/parent-students';
import { SystemApi } from './resources/system';
import { SpeakersApi } from './resources/speakers';
import { LocationsApi } from './resources/locations';
import { TrainingLevelsApi } from './resources/training-levels';
import { TrainingSystemsApi } from './resources/training-systems';
import { MajorsApi } from './resources/majors';
import { CoursesApi } from './resources/courses';
import { AcademicYearsApi } from './resources/academic-years';
import { EventsApi } from './resources/events';
import { CamerasApi } from './resources/cameras';
import { TemplatesApi } from './resources/templates';
import { ScreensApi } from './resources/screens';
import { DepartmentsApi } from './resources/departments';
import type { HealthStatus } from './types';

/**
 * Default API URL when the consumer doesn't pass one. Kept as an export so
 * Next.js / NestJS callers can reuse it without hard-coding the value.
 */
export const DEFAULT_API_URL = 'http://localhost:3002/api';

/**
 * SDK thu gon theo pham vi entity HUB: users, posts, categories, tags, roles/permissions.
 *
 * The SDK is intentionally platform-agnostic: it does not read environment
 * variables itself. Each consumer (web app, NestJS service, mobile, ...) is
 * responsible for resolving its own `baseUrl` and injecting it here.
 */
export class StoreSyncSdk {
  readonly http: ApiClient;
  readonly users: UsersApi;
  readonly posts: PostsApi;
  readonly categories: CategoriesApi;
  readonly tags: TagsApi;
  readonly guides: GuidesApi;
  readonly rbac: RbacApi;
  readonly contactRequests: ContactRequestsApi;
  readonly myStudents: MyStudentsApi;
  readonly parentStudents: ParentStudentsApi;
  readonly system: SystemApi;
  readonly speakers: SpeakersApi;
  readonly locations: LocationsApi;
  readonly trainingLevels: TrainingLevelsApi;
  readonly trainingSystems: TrainingSystemsApi;
  readonly majors: MajorsApi;
  readonly courses: CoursesApi;
  readonly academicYears: AcademicYearsApi;
  readonly events: EventsApi;
  readonly cameras: CamerasApi;
  readonly templates: TemplatesApi;
  readonly screens: ScreensApi;
  readonly departments: DepartmentsApi;

  constructor(options: ApiClientOptions) {
    this.http = new ApiClient(options);
    this.users = new UsersApi(this.http);
    this.posts = new PostsApi(this.http);
    this.categories = new CategoriesApi(this.http);
    this.tags = new TagsApi(this.http);
    this.guides = new GuidesApi(this.http);
    this.rbac = new RbacApi(this.http);
    this.contactRequests = new ContactRequestsApi(this.http);
    this.myStudents = new MyStudentsApi(this.http);
    this.parentStudents = new ParentStudentsApi(this.http);
    this.system = new SystemApi(this.http);
    this.speakers = new SpeakersApi(this.http);
    this.locations = new LocationsApi(this.http);
    this.trainingLevels = new TrainingLevelsApi(this.http);
    this.trainingSystems = new TrainingSystemsApi(this.http);
    this.majors = new MajorsApi(this.http);
    this.courses = new CoursesApi(this.http);
    this.academicYears = new AcademicYearsApi(this.http);
    this.events = new EventsApi(this.http);
    this.cameras = new CamerasApi(this.http);
    this.templates = new TemplatesApi(this.http);
    this.screens = new ScreensApi(this.http);
    this.departments = new DepartmentsApi(this.http);
  }

  health(): Promise<HealthStatus> {
    return this.http.get<HealthStatus>('/health');
  }
}

/**
 * Convenience factory. Accepts a string (baseUrl only) or full options.
 * Falls back to {@link DEFAULT_API_URL} when nothing is supplied – useful for
 * tests; production consumers should always pass an explicit baseUrl.
 */
export const createStoreSyncSdk = (
  options: ApiClientOptions | string = DEFAULT_API_URL,
): StoreSyncSdk => {
  const opts: ApiClientOptions =
    typeof options === 'string' ? { baseUrl: options } : options;
  return new StoreSyncSdk(opts);
};
