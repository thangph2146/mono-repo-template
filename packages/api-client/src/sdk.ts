import { ApiClient, type ApiClientOptions } from './client';
import { CategoriesApi } from './resources/categories';
import { PostsApi } from './resources/posts';
import { RbacApi } from './resources/rbac';
import { TagsApi } from './resources/tags';
import { UsersApi } from './resources/users';
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
  readonly rbac: RbacApi;

  constructor(options: ApiClientOptions) {
    this.http = new ApiClient(options);
    this.users = new UsersApi(this.http);
    this.posts = new PostsApi(this.http);
    this.categories = new CategoriesApi(this.http);
    this.tags = new TagsApi(this.http);
    this.rbac = new RbacApi(this.http);
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
