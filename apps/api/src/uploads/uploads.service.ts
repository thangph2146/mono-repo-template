/**
 * Uploads Service - Quản lý file/thư mục upload (lưu trên disk tại API).
 * Cấu trúc thư mục: STORAGE_DIR/uploads/images và STORAGE_DIR/[custom].
 *
 * Có thể chuyển data ra ngoài thư mục tuyen-sinh-api bằng cách set env STORAGE_DIR
 * (đường dẫn tuyệt đối hoặc tương đối với process.cwd()).
 * VD: STORAGE_DIR=D:/HUB/data hoặc STORAGE_DIR=../shared-data
 */
import { Injectable } from '@nestjs/common';
import { createReadStream } from 'fs';
import { stat, readdir, mkdir, unlink, rmdir } from 'fs/promises';
import type { ReadStream } from 'fs';
import * as path from 'path';
import { appConfig } from '../config/app.config';

const STORAGE_DIR = path.normalize(appConfig.storageDir);
const UPLOADS_DIR = path.normalize(path.join(STORAGE_DIR, 'uploads'));
const IMAGES_DIR = path.normalize(path.join(UPLOADS_DIR, 'images'));
const FILES_DIR = path.normalize(path.join(UPLOADS_DIR, 'files'));

// Allow list cho cả ảnh + file đính kèm (phục vụ download trong editor).
// Lưu ý: chỉ dựa theo ext để tránh trường hợp browser trả về mimeType trống/không chuẩn.
const ALLOWED_EXT = [
  // Images
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.webp',
  '.svg',
  // Docs / Spreadsheets
  '.pdf',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.csv',
  '.rtf',
  // Archives / Misc
  '.zip',
  '.rar',
  '.7z',
  '.txt',
  // Presentations
  '.ppt',
  '.pptx',
  '.webm',
  // Audio / video (đồng bộ với input accept trong editor)
  '.mp3',
  '.wav',
  '.mp4',
  '.mov',
  '.avi',
  '.m4v',
  // Ảnh phổ biến từ thiết bị
  '.bmp',
  '.tif',
  '.tiff',
  '.heic',
  '.heif',
];

const ALLOWED_MIME: Record<string, string> = {
  // Images
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',

  // Docs
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx':
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.rtf': 'application/rtf',
  '.txt': 'text/plain; charset=utf-8',

  // Spreadsheets
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.csv': 'text/csv; charset=utf-8',

  // Archives
  '.zip': 'application/zip',
  '.rar': 'application/vnd.rar',
  '.7z': 'application/x-7z-compressed',

  // Presentations
  '.ppt': 'application/vnd.ms-powerpoint',
  '.pptx':
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',

  '.webm': 'video/webm',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.mp4': 'video/mp4',
  '.mov': 'video/quicktime',
  '.avi': 'video/x-msvideo',
  '.m4v': 'video/x-m4v',
  '.bmp': 'image/bmp',
  '.tif': 'image/tiff',
  '.tiff': 'image/tiff',
  '.heic': 'image/heic',
  '.heif': 'image/heif',
};

/** MIME chuẩn hóa → đuôi file (chỉ dùng khi tên file thiếu đuôi hoặc không khớp allow-list). */
const PRIMARY_MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
  'image/svg+xml': '.svg',
  'image/bmp': '.bmp',
  'image/tiff': '.tiff',
  'image/heic': '.heic',
  'image/heif': '.heif',
  'application/pdf': '.pdf',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
    '.docx',
  'application/rtf': '.rtf',
  'text/plain': '.txt',
  'application/vnd.ms-excel': '.xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
  'text/csv': '.csv',
  'application/zip': '.zip',
  'application/vnd.rar': '.rar',
  'application/x-rar-compressed': '.rar',
  'application/x-7z-compressed': '.7z',
  'application/vnd.ms-powerpoint': '.ppt',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation':
    '.pptx',
  'video/webm': '.webm',
  'video/mp4': '.mp4',
  'video/quicktime': '.mov',
  'video/x-msvideo': '.avi',
  'video/x-m4v': '.m4v',
  'audio/mpeg': '.mp3',
  'audio/wav': '.wav',
  'audio/x-wav': '.wav',
};

export interface ImageItemDto {
  fileName: string;
  originalName: string;
  size: number;
  mimeType: string;
  url: string;
  relativePath: string;
  createdAt: number;
}

export interface FolderNodeDto {
  name: string;
  path: string;
  images: ImageItemDto[];
  subfolders: FolderNodeDto[];
}

export interface FolderItemDto {
  path: string;
  name: string;
}

export interface ListImagesResult {
  data: ImageItemDto[];
  folderTree: FolderNodeDto | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ListFoldersResult {
  data: FolderItemDto[];
}

@Injectable()
export class UploadsService {
  private getImagesDir(): string {
    return IMAGES_DIR;
  }

  private getStorageDir(): string {
    return STORAGE_DIR;
  }

  private getUploadsDir(): string {
    return UPLOADS_DIR;
  }

  /** Đảm bảo thư mục tồn tại */
  private async ensureDir(dirPath: string): Promise<void> {
    if (
      !dirPath ||
      dirPath === '.' ||
      dirPath === '/' ||
      dirPath === '\\' ||
      dirPath.includes('\\\\?')
    ) {
      return;
    }
    const normalized = path.normalize(path.resolve(dirPath));
    // Check for malformed Windows path after resolve
    if (normalized.startsWith('\\\\?\\')) {
      // This is fine for long paths, but if it's just \\?\, it's invalid
      if (normalized.length <= 4) return;
    }
    try {
      await stat(normalized);
    } catch {
      await mkdir(normalized, { recursive: true });
    }
  }

  /** Kiểm tra path có phải năm/tháng/ngày */
  private hasDateStructure(folderPath: string): boolean {
    const parts = folderPath.split('/').filter(Boolean);
    if (parts.length < 3) return false;
    const [y, m, d] = parts.slice(-3);
    return (
      /^\d{4}$/.test(y) &&
      /^(0[1-9]|1[0-2])$/.test(m) &&
      /^(0[1-9]|[12]\d|3[01])$/.test(d)
    );
  }

  /** Tạo đường dẫn lưu file (giống admin generateFilePath) */
  generateFilePath(
    fileName: string,
    customFolderPath?: string,
    isExistingFolder = false,
    serveBaseUrl = '',
    uploadKind: 'images' | 'files' = 'images',
  ): { relativePath: string; fullPath: string; urlPath: string } {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const dateDir = path.join(year.toString(), month, day);

    const baseDir = uploadKind === 'images' ? IMAGES_DIR : FILES_DIR;
    const prefix = uploadKind; // "images" | "files"

    let fullPath: string;
    let relativePath: string;

    if (customFolderPath) {
      const clean = customFolderPath
        .replace(/^images\//, '')
        .replace(/^files\//, '')
        .replace(/\/$/, '');

      if (isExistingFolder) {
        // Nếu folder dạng date (YYYY/MM/DD) thì lưu trực tiếp vào folder đó.
        // Còn nếu không phải date thì vẫn lưu theo cùng layout dưới baseDir.
        const targetDir = this.hasDateStructure(clean)
          ? path.join(clean)
          : path.join(clean);
        fullPath = path.normalize(path.join(baseDir, targetDir, fileName));
        relativePath = path
          .join(prefix, targetDir, fileName)
          .replace(/\\/g, '/');
      } else {
        // Trường hợp "không phải folder đã tồn tại": lưu vào <clean>/<dateDir>
        const finalPath = path.join(clean, dateDir);
        fullPath = path.normalize(path.join(baseDir, finalPath, fileName));
        relativePath = path
          .join(prefix, finalPath, fileName)
          .replace(/\\/g, '/');
      }
    } else {
      // Không chọn folder => lưu theo ngày tháng năm
      fullPath = path.normalize(path.join(baseDir, dateDir, fileName));
      relativePath = path.join(prefix, dateDir, fileName).replace(/\\/g, '/');
    }

    const urlPath = serveBaseUrl
      ? `${serveBaseUrl}/${relativePath}`
      : `/api/admin/uploads/serve/${relativePath}`;

    return { relativePath, fullPath, urlPath };
  }

  /** Quét đệ quy lấy tất cả ảnh trong một thư mục */
  private async scanImagesInDir(
    dirPath: string,
    baseRelative: string,
    serveBaseUrl: string,
  ): Promise<ImageItemDto[]> {
    const result: ImageItemDto[] = [];
    try {
      const entries = await readdir(dirPath, { withFileTypes: true });
      for (const entry of entries) {
        const full = path.join(dirPath, entry.name);
        const rel = baseRelative ? `${baseRelative}/${entry.name}` : entry.name;
        if (entry.isDirectory()) {
          const sub = await this.scanImagesInDir(full, rel, serveBaseUrl);
          result.push(...sub);
        } else {
          const ext = path.extname(entry.name).toLowerCase();
          if (!ALLOWED_EXT.includes(ext)) continue;
          try {
            const st = await stat(full);
            const mimeType = ALLOWED_MIME[ext] || 'application/octet-stream';
            const url = serveBaseUrl
              ? `${serveBaseUrl}/${rel}`
              : `/api/admin/uploads/serve/${rel}`;
            result.push({
              fileName: entry.name,
              originalName: entry.name,
              size: st.size,
              mimeType,
              url,
              relativePath: rel,
              createdAt: st.mtimeMs,
            });
          } catch {
            // skip unreadable
          }
        }
      }
    } catch {
      // dir not found or not readable
    }
    return result;
  }

  /** Lấy danh sách ảnh (cả images + storage), có pagination và folderTree */
  async listImages(params: {
    page: number;
    limit: number;
    serveBaseUrl?: string;
  }): Promise<ListImagesResult> {
    const serveBaseUrl = (params.serveBaseUrl || '').replace(/\/$/, '');
    const allImages: ImageItemDto[] = [];

    // Scan IMAGES_DIR (images/...)
    const imagesRel = 'images';
    const fromImages = await this.scanImagesInDir(
      IMAGES_DIR,
      imagesRel,
      serveBaseUrl,
    );
    allImages.push(...fromImages);

    // Scan FILES_DIR (files/...)
    const filesRel = 'files';
    const fromFiles = await this.scanImagesInDir(
      FILES_DIR,
      filesRel,
      serveBaseUrl,
    );
    allImages.push(...fromFiles);

    // Scan STORAGE_DIR nhưng bỏ qua thư mục 'uploads'
    try {
      const top = await readdir(STORAGE_DIR, { withFileTypes: true });
      for (const entry of top) {
        if (!entry.isDirectory() || entry.name === 'uploads') continue;
        const full = path.join(STORAGE_DIR, entry.name);
        const sub = await this.scanImagesInDir(full, entry.name, serveBaseUrl);
        allImages.push(...sub);
      }
    } catch {
      // ignore
    }

    // Sắp xếp theo createdAt giảm dần
    allImages.sort((a, b) => b.createdAt - a.createdAt);

    const total = allImages.length;
    const page = Math.max(1, params.page);
    const limit = Math.min(100, Math.max(1, params.limit));
    const totalPages = Math.ceil(total / limit) || 1;
    const start = (page - 1) * limit;
    const data = allImages.slice(start, start + limit);

    const folderTree = this.buildFolderTree(allImages);

    return {
      data,
      folderTree,
      pagination: { page, limit, total, totalPages },
    };
  }

  /** Xây folder tree từ danh sách ảnh */
  private buildFolderTree(images: ImageItemDto[]): FolderNodeDto {
    const root: FolderNodeDto = {
      name: '',
      path: '',
      images: [],
      subfolders: [],
    };
    const pathToNode = new Map<string, FolderNodeDto>();
    pathToNode.set('', root);

    for (const img of images) {
      const parts = img.relativePath.split('/').filter(Boolean);
      const fileName = parts.pop();
      if (!fileName) continue;
      let currentPath = '';
      let current = root;
      for (const part of parts) {
        const nextPath = currentPath ? `${currentPath}/${part}` : part;
        let node = pathToNode.get(nextPath);
        if (!node) {
          node = { name: part, path: nextPath, images: [], subfolders: [] };
          current.subfolders.push(node);
          pathToNode.set(nextPath, node);
        }
        current = node;
        currentPath = nextPath;
      }
      current.images.push(img);
    }
    return root;
  }

  /** Danh sách thư mục (path + name) */
  async listFolders(): Promise<ListFoldersResult> {
    const folderSet = new Set<string>();
    const addFromImages = async (dir: string, prefix: string) => {
      try {
        const entries = await readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
          if (!entry.isDirectory()) continue;
          const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
          folderSet.add(rel);
          await addFromImages(path.join(dir, entry.name), rel);
        }
      } catch {
        // ignore
      }
    };
    await addFromImages(IMAGES_DIR, 'images');
    await addFromImages(FILES_DIR, 'files');
    try {
      const top = await readdir(STORAGE_DIR, { withFileTypes: true });
      for (const entry of top) {
        if (!entry.isDirectory() || entry.name === 'uploads') continue;
        folderSet.add(entry.name);
        await addFromImages(path.join(STORAGE_DIR, entry.name), entry.name);
      }
    } catch {
      // ignore
    }

    const data: FolderItemDto[] = Array.from(folderSet)
      .sort()
      .map((p) => ({
        path: p,
        name: path.basename(p),
      }));
    return { data };
  }

  /** Tạo thư mục */
  async createFolder(
    folderName: string,
    parentPath?: string | null,
    resourceType: 'images' | 'files' = 'images',
  ): Promise<{ folderName: string; folderPath: string }> {
    const safeName = folderName
      .replace(/[^a-zA-Z0-9-_]/g, '_')
      .replace(/\/+/g, '');
    if (!safeName) throw new Error('Tên thư mục không hợp lệ');

    let targetDir: string;
    let folderPath: string;

    if (parentPath) {
      const trimmed = parentPath.replace(/\/$/, '');

      if (trimmed.startsWith('images/')) {
        const clean = trimmed.replace(/^images\//, '');
        targetDir = path.join(IMAGES_DIR, clean, safeName);
        folderPath = path.join('images', clean, safeName).replace(/\\/g, '/');
      } else if (trimmed.startsWith('files/')) {
        const clean = trimmed.replace(/^files\//, '');
        targetDir = path.join(FILES_DIR, clean, safeName);
        folderPath = path.join('files', clean, safeName).replace(/\\/g, '/');
      } else {
        // Legacy: folderPath không có prefix images/files
        const clean = trimmed.replace(/^images\//, '');
        if (clean.startsWith('images') || this.hasDateStructure(clean)) {
          targetDir = path.join(
            IMAGES_DIR,
            clean.replace(/^images\/?/, ''),
            safeName,
          );
          folderPath = path
            .join('images', clean.replace(/^images\/?/, ''), safeName)
            .replace(/\\/g, '/');
        } else {
          targetDir = path.join(STORAGE_DIR, clean, safeName);
          folderPath = path.join(clean, safeName).replace(/\\/g, '/');
        }
      }
    } else {
      // Root create
      if (resourceType === 'files') {
        targetDir = path.join(FILES_DIR, safeName);
        folderPath = path.join('files', safeName).replace(/\\/g, '/');
      } else {
        targetDir = path.join(STORAGE_DIR, safeName);
        folderPath = safeName;
      }
    }

    await this.ensureDir(targetDir);
    return { folderName: safeName, folderPath };
  }

  /** Lưu file upload (buffer) và trả về metadata. Không cho phép upload trùng tên (cùng tên file trong cùng thư mục). */
  async saveFile(
    file: { buffer: Buffer; originalname: string; mimetype: string },
    folderPath?: string,
    isExistingFolder?: boolean,
    serveBaseUrl?: string,
  ): Promise<{
    fileName: string;
    originalName: string;
    size: number;
    mimeType: string;
    url: string;
    relativePath: string;
  }> {
    const rawExt = path.extname(file.originalname).toLowerCase();
    const mimePrimary = (file.mimetype || '')
      .split(';')[0]
      .trim()
      .toLowerCase();

    let ext = rawExt;
    if (!ALLOWED_EXT.includes(ext)) {
      // Chỉ suy đuôi từ MIME khi không có đuôi — tránh ghi đè tên kiểu "file.exe".
      if (
        ext === '' &&
        mimePrimary &&
        mimePrimary !== 'application/octet-stream'
      ) {
        const inferred = PRIMARY_MIME_TO_EXT[mimePrimary];
        if (inferred && ALLOWED_EXT.includes(inferred)) {
          ext = inferred;
        }
      }
    }

    if (!ALLOWED_EXT.includes(ext)) {
      throw new Error(
        [
          'Định dạng file không được phép.',
          rawExt ? `Đuôi: ${rawExt}` : 'Không có đuôi file.',
          mimePrimary ? `MIME: ${mimePrimary}` : '',
        ]
          .filter(Boolean)
          .join(' '),
      );
    }

    const uploadKind: 'images' | 'files' = ALLOWED_MIME[ext]?.startsWith(
      'image/',
    )
      ? 'images'
      : 'files';

    const stripForBase = rawExt || ext;
    const baseName = path
      .basename(file.originalname, stripForBase || undefined)
      .replace(/[^a-zA-Z0-9-_]/g, '_');
    const uniqueName = `${baseName}_${Date.now()}${ext}`;

    const { fullPath, relativePath, urlPath } = this.generateFilePath(
      uniqueName,
      folderPath || undefined,
      isExistingFolder === true,
      serveBaseUrl,
      uploadKind,
    );

    const targetDir = path.dirname(fullPath);
    await this.ensureDir(targetDir);

    // Kiểm tra trùng tên: trong cùng thư mục đã có file cùng baseName + ext chưa
    const exists = await this.hasFileWithSameBaseName(targetDir, baseName, ext);
    if (exists) {
      throw new Error('Hình ảnh hoặc file đã tồn tại');
    }

    const { writeFile } = await import('fs/promises');
    await writeFile(fullPath, file.buffer);

    const resolvedMime =
      ALLOWED_MIME[ext] ||
      mimePrimary ||
      file.mimetype ||
      'application/octet-stream';

    return {
      fileName: uniqueName,
      originalName: file.originalname,
      size: file.buffer.length,
      mimeType: resolvedMime,
      url: urlPath,
      relativePath,
    };
  }

  /**
   * Kiểm tra trong thư mục đã có file có cùng baseName và ext chưa (bỏ qua phần _timestamp).
   * So sánh không phân biệt hoa/thường để trùng "Photo.jpg" và "photo.jpg".
   */
  private async hasFileWithSameBaseName(
    dirPath: string,
    baseName: string,
    ext: string,
  ): Promise<boolean> {
    try {
      const entries = await readdir(dirPath, { withFileTypes: true });
      const prefix = baseName + '_';
      const prefixLower = prefix.toLowerCase();
      const extLower = ext.toLowerCase();
      return entries.some(
        (e) =>
          !e.isDirectory() &&
          e.name.toLowerCase().startsWith(prefixLower) &&
          e.name.toLowerCase().endsWith(extLower),
      );
    } catch {
      return false;
    }
  }

  /** Xóa file theo relativePath */
  async deleteFile(relativePath: string): Promise<void> {
    const { fullPath } = this.resolvePath(relativePath);
    await unlink(fullPath);
  }

  /** Xóa thư mục đệ quy */
  private async deleteDirRecursive(dirPath: string): Promise<void> {
    const entries = await readdir(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        await this.deleteDirRecursive(full);
      } else {
        await unlink(full);
      }
    }
    await rmdir(dirPath);
  }

  async deleteFolder(relativePath: string): Promise<void> {
    const clean = relativePath.replace(/\/$/, '').replace(/\.\./g, '');
    let fullPath: string;
    let baseDir: string;
    if (clean.startsWith('images/')) {
      fullPath = path.resolve(IMAGES_DIR, clean.slice(7));
      baseDir = path.resolve(IMAGES_DIR);
    } else if (clean.startsWith('files/')) {
      fullPath = path.resolve(FILES_DIR, clean.slice(6));
      baseDir = path.resolve(FILES_DIR);
    } else {
      fullPath = path.resolve(STORAGE_DIR, clean);
      baseDir = path.resolve(STORAGE_DIR);
    }
    if (!fullPath.startsWith(baseDir) || fullPath === baseDir) {
      throw new Error('Đường dẫn không hợp lệ');
    }
    const st = await stat(fullPath).catch(() => null);
    if (!st?.isDirectory()) throw new Error('Thư mục không tồn tại');
    await this.deleteDirRecursive(fullPath);
  }

  /** Resolve relativePath -> fullPath (bảo mật) */
  resolvePath(relativePath: string): { fullPath: string; baseDir: string } {
    const normalized = relativePath.replace(/\.\./g, '').replace(/\\/g, '/');
    if (normalized.startsWith('images/')) {
      const fromImages = path.join(IMAGES_DIR, normalized.slice(7));
      return {
        fullPath: path.resolve(fromImages),
        baseDir: path.resolve(IMAGES_DIR),
      };
    } else if (normalized.startsWith('files/')) {
      const fromFiles = path.join(FILES_DIR, normalized.slice(6));
      return {
        fullPath: path.resolve(fromFiles),
        baseDir: path.resolve(FILES_DIR),
      };
    }
    const fromStorage = path.join(STORAGE_DIR, normalized);
    return {
      fullPath: path.resolve(fromStorage),
      baseDir: path.resolve(STORAGE_DIR),
    };
  }

  /** Stream file để serve (trả về stream + contentType) */
  async serveFile(
    relativePath: string,
  ): Promise<{ stream: ReadStream; contentType: string }> {
    const { fullPath, baseDir } = this.resolvePath(relativePath);
    if (!fullPath.startsWith(baseDir)) {
      throw new Error('Invalid path');
    }
    const st = await stat(fullPath);
    if (!st.isFile()) throw new Error('Not a file');
    const ext = path.extname(fullPath).toLowerCase();
    const contentType = ALLOWED_MIME[ext] || 'application/octet-stream';
    const stream = createReadStream(fullPath);
    return { stream, contentType };
  }
}
