/**
 * Định dạng gọn payload cho console dev — không log secret/password.
 */

const REDACT_KEYS = new Set(
  [
    'password',
    'currentpassword',
    'newpassword',
    'token',
    'accesstoken',
    'refreshtoken',
    'secret',
    'authorization',
  ].map((k) => k.toLowerCase()),
);

function redactDeep(value: unknown, depth: number): unknown {
  if (depth <= 0) return '…';
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) {
    if (value.length === 0) return [];
    const cap = Math.min(value.length, 5);
    return value.slice(0, cap).map((v) => redactDeep(v, depth - 1));
  }
  if (typeof value !== 'object') return value;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (REDACT_KEYS.has(k.toLowerCase())) {
      out[k] = '[redacted]';
    } else {
      out[k] = redactDeep(v, depth - 1);
    }
  }
  return out;
}

function stringifyCapped(value: unknown, maxLen: number): string {
  try {
    const s = JSON.stringify(value);
    if (s.length <= maxLen) return s;
    return `${s.slice(0, maxLen)}…(+${s.length - maxLen}b)`;
  } catch {
    return String(value);
  }
}

/** Gần giống AuthUser / User từ API. */
function looksLikeAuthUser(o: Record<string, unknown>): boolean {
  return (
    (typeof o.id === 'string' || typeof o.id === 'number') &&
    typeof o.email === 'string' &&
    Array.isArray(o.permissions) &&
    Array.isArray(o.roles)
  );
}

function summarizeAuthUser(o: Record<string, unknown>): string {
  const roles = (o.roles as { name?: string; displayName?: string }[])
    .map((r) => r?.name)
    .filter(Boolean)
    .join(',');
  const perms = o.permissions as string[];
  const permBit = perms.includes('*')
    ? 'perms=*'
    : `perms=n=${perms.length}[${perms.slice(0, 8).join(',')}${perms.length > 8 ? ',…' : ''}]`;
  const nameBit =
    typeof o.name === 'string' && o.name.length > 0
      ? ` name="${o.name}"`
      : '';
  return `AuthUser id=${o.id} email=${o.email}${nameBit} roles=[${roles}] ${permBit}`;
}

export function formatDevRequestBody(body: unknown): string | undefined {
  if (body === undefined || body === null) return undefined;
  if (body instanceof FormData) return '{FormData}';
  if (typeof body !== 'object') {
    return stringifyCapped(body, 200);
  }
  const safe = redactDeep(body, 4) as Record<string, unknown>;
  return stringifyCapped(safe, 500);
}

export function formatDevResponsePayload(
  status: number,
  payload: unknown,
  ok: boolean,
): string | undefined {
  if (!ok) {
    if (payload === null || payload === undefined) {
      return `error status=${status}`;
    }
    if (typeof payload === 'object' && payload !== null) {
      const r = payload as Record<string, unknown>;
      const msg = r.message;
      const m =
        typeof msg === 'string'
          ? msg
          : Array.isArray(msg)
            ? msg.join(', ')
            : undefined;
      return stringifyCapped(
        m ? { status, message: m, body: redactDeep(payload, 3) } : redactDeep(payload, 3),
        600,
      );
    }
    return stringifyCapped(payload, 400);
  }

  if (payload === null) return 'null';
  if (payload === undefined) return undefined;
  if (typeof payload === 'string') {
    return payload.length > 200 ? `${payload.slice(0, 200)}…` : payload;
  }
  if (Array.isArray(payload)) {
    if (payload.length === 0) return 'Mảng rỗng';
    return `Mảng ${payload.length} phần tử — xem khối Payload (preview 2 phần tử đầu)`;
  }
  if (typeof payload === 'object') {
    const o = payload as Record<string, unknown>;
    if (looksLikeAuthUser(o)) {
      return summarizeAuthUser(o);
    }
    const keys = Object.keys(o);
    return `Object (${keys.length} keys: ${keys.slice(0, 8).join(', ')}${keys.length > 8 ? ', …' : ''}) — chi tiết ở Payload`;
  }
  return String(payload);
}

/** Một dòng phụ: gợi ý “state” sau login / session. */
export function formatDevApiStateHint(
  path: string,
  method: string,
  payload: unknown,
  ok: boolean,
): string | undefined {
  if (!ok || payload === null || typeof payload !== 'object') return undefined;
  if (
    method !== 'POST' ||
    (!path.endsWith('/users/login') && !path.endsWith('/admin/auth/login'))
  ) {
    return undefined;
  }
  const o = payload as Record<string, unknown>;
  if (!looksLikeAuthUser(o)) return undefined;
  return `sau login: lưu session (sessionStorage) → các request sau gửi X-User-Id=${o.id}; roles=[${(o.roles as { name?: string }[]).map((r) => r?.name).filter(Boolean).join(',')}]`;
}

/** Bản sao đã redact để mở rộng trong console.debug (DevTools). */
export function redactForDevExpand(payload: unknown): unknown {
  return redactDeep(payload, 6);
}

function stripAuthLabel(authSuffix: string): string {
  return authSuffix.replace(/^\s*\|\s*auth:\s*/i, '').trim();
}

function safeJsonStringify(value: unknown, space: number, maxChars: number): string {
  try {
    const s = JSON.stringify(value, null, space);
    if (s.length <= maxChars) return s;
    return `${s.slice(0, maxChars)}\n… (+${s.length - maxChars} ký tự)`;
  } catch {
    return String(value);
  }
}

const MONO_BLOCK =
  'color:#334155;font-size:12px;line-height:1.55;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;white-space:pre';

function isOrdersPath(path: string): boolean {
  return path === '/orders' || path.startsWith('/orders/') || path.startsWith('/orders?');
}

function isProductsPath(path: string): boolean {
  return path === '/products' || path.startsWith('/products/') || path.startsWith('/products?');
}

function simplifyUserRef(u: unknown): unknown {
  if (!u || typeof u !== 'object') return u;
  const r = u as Record<string, unknown>;
  return {
    id: r.id,
    email: r.email,
    name: r.name ?? r.fullName,
  };
}

function simplifyOrderPreviewRow(o: unknown): unknown {
  if (!o || typeof o !== 'object') return o;
  const row = { ...(o as Record<string, unknown>) };
  if (row.customer) row.customer = simplifyUserRef(row.customer);
  if (typeof row.items === 'string') {
    const t = row.items.trim();
    if (t.startsWith('[') || t.startsWith('{')) {
      try {
        row.items = JSON.parse(row.items as string);
      } catch {
        /* giữ chuỗi */
      }
    }
  }
  return row;
}

function simplifyProductPreviewRow(o: unknown): unknown {
  if (!o || typeof o !== 'object') return o;
  const r = o as Record<string, unknown>;
  const ut = r.unitTypes;
  const im = r.images;
  return {
    id: r.id,
    sku: r.sku,
    name: r.name,
    category: r.category,
    retailPrice: r.retailPrice,
    stock: r.stock,
    unit: r.unit,
    unitTypes: Array.isArray(ut) ? `${ut.length} loại` : ut,
    images: Array.isArray(im) ? `${im.length} ảnh` : im,
  };
}

function shapeArrayPreviewForPath(path: string, preview: unknown[]): unknown[] {
  if (isOrdersPath(path)) return preview.map(simplifyOrderPreviewRow);
  if (isProductsPath(path)) return preview.map(simplifyProductPreviewRow);
  return preview;
}

/**
 * Gói log một lần gọi API: một nhóm thu gọn + **một** khối monospace (ít dòng stack hơn).
 */
export function printDevApiCall(options: {
  tag: string;
  method: string;
  path: string;
  status: number;
  ms: number;
  reqBodyText?: string;
  authSuffix: string;
  respSummary?: string;
  stateHint?: string;
  responseJson?: unknown;
  maxJsonChars?: number;
}): void {
  const {
    tag,
    method,
    path,
    status,
    ms,
    reqBodyText,
    authSuffix,
    respSummary,
    stateHint,
    responseJson,
    maxJsonChars = 8000,
  } = options;

  const statusStyle =
    status >= 200 && status < 300
      ? 'color:#16a34a;font-weight:600'
      : status >= 400
        ? 'color:#dc2626;font-weight:600'
        : 'color:#ca8a04;font-weight:600';

  console.groupCollapsed(
    `%c${tag}%c ${method}%c ${path}%c ${status}%c ${ms.toFixed(0)}ms`,
    'color:#64748b;font-weight:600',
    'color:#2563eb;font-weight:600',
    'color:#1e293b',
    statusStyle,
    'color:#94a3b8',
  );

  const authText = stripAuthLabel(authSuffix);
  const lines: string[] = [];

  if (reqBodyText) {
    lines.push('── Request ──');
    try {
      lines.push(safeJsonStringify(JSON.parse(reqBodyText), 2, maxJsonChars));
    } catch {
      lines.push(reqBodyText);
    }
    lines.push('');
  }

  if (authText) {
    lines.push('── Auth ──');
    lines.push(authText);
    lines.push('');
  }

  if (respSummary) {
    lines.push('── Tóm tắt ──');
    lines.push(respSummary);
    lines.push('');
  }

  if (stateHint) {
    lines.push('── Gợi ý ──');
    lines.push(stateHint);
    lines.push('');
  }

  if (responseJson !== undefined) {
    lines.push('── Payload (đã redact) ──');
    lines.push(safeJsonStringify(responseJson, 2, maxJsonChars));
  }

  if (lines.length > 0) {
    console.log('%c%s', MONO_BLOCK, lines.join('\n').trimEnd());
  }

  console.groupEnd();
}

export function buildDevLogResponseJson(
  path: string,
  ok: boolean,
  payload: unknown,
): unknown | undefined {
  if (payload === null || payload === undefined) return undefined;
  if (!ok) {
    if (typeof payload === 'object') return redactDeep(payload, 5);
    return { _shape: 'error-text', value: String(payload).slice(0, 800) };
  }
  if (Array.isArray(payload)) {
    const previewRaw = redactDeep(payload.slice(0, 2), 5) as unknown[];
    const preview = Array.isArray(previewRaw)
      ? shapeArrayPreviewForPath(path, previewRaw)
      : previewRaw;
    return {
      _shape: 'array',
      length: payload.length,
      preview,
    };
  }
  if (typeof payload === 'object') {
    return redactDeep(payload, 6);
  }
  return { _shape: 'primitive', value: payload };
}

export function printDevApiNetworkError(options: {
  tag: string;
  method: string;
  path: string;
  ms: number;
  authSuffix: string;
  err: unknown;
}): void {
  const { tag, method, path, ms, authSuffix, err } = options;
  console.groupCollapsed(
    `%c${tag}%c ${method}%c ${path}%c lỗi mạng`,
    'color:#64748b;font-weight:600',
    'color:#2563eb;font-weight:600',
    'color:#1e293b',
    'color:#dc2626;font-weight:600',
  );
  console.log(`Sau ${ms.toFixed(0)}ms`);
  const authText = stripAuthLabel(authSuffix);
  if (authText) console.log('Auth:', authText);
  console.warn(err);
  console.groupEnd();
}
