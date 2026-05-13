import 'dotenv/config';
import * as path from 'path';
import { APP_HEADERS } from './constants';

function getAllowedOrigins(): string[] | true {
  const raw = process.env.ALLOWED_ORIGINS;
  if (!raw || typeof raw !== 'string') return true;
  const list = raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return list.length > 0 ? list : true;
}

const STORAGE_DIR = path.normalize(
  process.env.STORAGE_DIR != null && process.env.STORAGE_DIR !== ''
    ? path.resolve(process.cwd(), process.env.STORAGE_DIR)
    : path.resolve(process.cwd(), 'data'),
);

export const appConfig = {
  port: parseInt(process.env.PORT || '3002', 10),
  globalPrefix: 'api',
  nodeEnv: process.env.NODE_ENV || 'development',
  publicUrl: process.env.API_PUBLIC_URL,
  databaseUrl: process.env.DATABASE_URL,
  /**
   * Giới hạn body JSON (Express). Mặc định 1gb; tăng thêm: `HTTP_JSON_BODY_LIMIT=2gb`.
   * 413: Nginx phải ≥ mức này, ví dụ `client_max_body_size 1g;` (hoặc `2g`) trong
   * `http` / `server` / `location` proxy tới API — reload nginx sau khi sửa.
   * Cloudflare Free ~100MB/request; upload ~1GB cần tắt proxy (DNS only) cho API hoặc gói phù hợp.
   *
   * Import user thiếu password: `IMPORT_FALLBACK_PASSWORD_PLAIN` (mặc định ImportFallback#2026) — đổi sau khi đăng nhập.
   */
  bodyLimit: process.env.HTTP_JSON_BODY_LIMIT?.trim() || '1gb',
  storageDir: STORAGE_DIR,
  allowedOrigins: getAllowedOrigins(),
  logging: {
    httpLogBodyMaxLen: parseInt(
      process.env.HTTP_LOG_BODY_MAX_LEN || '8000',
      10,
    ),
    httpLogErrorMaxLen: parseInt(
      process.env.HTTP_LOG_ERROR_MAX_LEN || '20000',
      10,
    ),
    httpLogResponseMaxLen: parseInt(
      process.env.HTTP_LOG_RESPONSE_MAX_LEN || '4000',
      10,
    ),
    httpLogSuccessBody:
      process.env.HTTP_LOG_SUCCESS_BODY != null
        ? process.env.HTTP_LOG_SUCCESS_BODY === 'true'
        : (process.env.NODE_ENV || 'development') === 'development',
  },
  cors: {
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'] as string[],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      APP_HEADERS.USER_ID,
      APP_HEADERS.VIEW_ALL,
    ] as string[],
    credentials: true,
  },
} as const;
