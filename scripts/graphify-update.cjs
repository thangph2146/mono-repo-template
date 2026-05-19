/**
 * Graphify — unified update script for all apps.
 *
 * Usage:
 *   node scripts/graphify-update.cjs apps/frontend
 *   node scripts/graphify-update.cjs apps/backend
 *   node scripts/graphify-update.cjs apps/api
 *   node scripts/graphify-update.cjs .          (root monorepo)
 */
const fs = require('fs');
const path = require('path');

const MONOREPO_ROOT = path.resolve(__dirname, '..');
const APP_REL = process.argv[2] || '.';
const APP_DIR = path.resolve(MONOREPO_ROOT, APP_REL);
const GRAPHIFY_DIR = path.join(APP_DIR, '.graphify');
const SNAPSHOT_DIR = path.join(GRAPHIFY_DIR, 'snapshot');

if (!fs.existsSync(APP_DIR)) {
  console.error(`❌ Directory not found: ${APP_REL}`);
  process.exit(1);
}

// ─── Only scan these roots ───────────────────────────────────────────────────
const SCAN_ROOTS = ['src', 'public'];

// ─── Skip these anywhere ─────────────────────────────────────────────────────
const IGNORE_DIRS = new Set(['node_modules', '.next', '.git', '.graphify',
  'docs', '.agents', '.qodo', '.windsurf', '.cursor']);
const IGNORE_FILES = new Set(['.DS_Store', 'pnpm-lock.yaml', 'package-lock.json',
  'yarn.lock', 'update.cjs', 'next-env.d.ts', 'skills-lock.json', 'favicon.ico']);
const IGNORE_EXTS = new Set(['.ico', '.png', '.jpg', '.jpeg', '.gif',
  '.webp', '.svg', '.woff', '.woff2', '.ttf', '.map']);

// ─── Next.js special file roles ──────────────────────────────────────────────
const NEXTJS_ROLES = {
  'layout.tsx': { color: '#ff6b35', size: 20, role: 'layout' },
  'layout.ts': { color: '#ff6b35', size: 20, role: 'layout' },
  'page.tsx': { color: '#00ff41', size: 14, role: 'page' },
  'page.ts': { color: '#00ff41', size: 14, role: 'page' },
  'loading.tsx': { color: '#888800', size: 10, role: 'loading' },
  'error.tsx': { color: '#cc3333', size: 10, role: 'error' },
  'not-found.tsx': { color: '#cc3333', size: 10, role: 'not-found' },
  'template.tsx': { color: '#ff6b35', size: 10, role: 'template' },
  'route.ts': { color: '#00ccff', size: 12, role: 'api-route' },
  'route.tsx': { color: '#00ccff', size: 12, role: 'api-route' },
  'middleware.ts': { color: '#ff00ff', size: 16, role: 'middleware' },
  'globals.css': { color: '#888888', size: 8, role: 'styles' },
};

let nodes = [];
let links = [];
let fileNodesMap = {};
let linkSet = new Set();

function sanitizeId(str) {
  return str.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
}

function normPath(p) {
  return p.replace(/\\/g, '/');
}

function addLink(source, target, relation) {
  const key = `${source}→${target}→${relation}`;
  if (!linkSet.has(key) && source !== target) {
    linkSet.add(key);
    links.push({ source, target, relation });
  }
}

// ─── Walk only SCAN_ROOTS ────────────────────────────────────────────────────
function walkDir(dir, parentId) {
  let entries;
  try { entries = fs.readdirSync(dir); } catch { return; }

  entries.forEach(file => {
    const fullPath = path.join(dir, file);
    const relPath = path.relative(APP_DIR, fullPath);
    const parts = relPath.split(path.sep);

    if (IGNORE_DIRS.has(file) || parts.some(p => IGNORE_DIRS.has(p))) return;
    if (IGNORE_FILES.has(file)) return;
    if (IGNORE_EXTS.has(path.extname(file).toLowerCase())) return;

    let stat;
    try { stat = fs.statSync(fullPath); } catch { return; }

    if (stat.isDirectory()) {
      const dirId = 'dir_' + sanitizeId(relPath);
      fileNodesMap[fullPath] = dirId;

      const rawLabel = path.basename(fullPath);
      const isRouteGroup = rawLabel.startsWith('(') && rawLabel.endsWith(')');
      const label = isRouteGroup ? rawLabel : rawLabel + '/';

      nodes.push({
        id: dirId,
        label,
        path: normPath(relPath),
        color: isRouteGroup ? '#888800' : '#ff9d00',
        size: isRouteGroup ? 15 : 22,
        community: normPath(path.relative(APP_DIR, dir)),
        type: isRouteGroup ? 'route-group' : 'directory',
      });

      if (parentId) addLink(parentId, dirId, 'contains');
      walkDir(fullPath, dirId);
    } else {
      const ext = path.extname(file).toLowerCase();
      const id = 'file_' + sanitizeId(relPath);
      fileNodesMap[fullPath] = id;

      const role = NEXTJS_ROLES[file];
      const isClientComponent = (() => {
        try {
          const first = fs.readFileSync(fullPath, 'utf8').slice(0, 200);
          return first.includes("'use client'") || first.includes('"use client"');
        } catch { return false; }
      })();

      nodes.push({
        id,
        label: file,
        path: normPath(relPath),
        color: role ? role.color : (isClientComponent ? '#00ddff' : '#00ff41'),
        size: role ? role.size : 10,
        community: normPath(path.relative(APP_DIR, dir)),
        type: role ? role.role : (ext ? ext.substring(1) : 'file'),
        client: isClientComponent,
      });

      if (parentId) addLink(parentId, id, 'contains');
    }
  });
}

// ─── Next.js layout → page/segment hierarchy ─────────────────────────────────
function inferNextjsHierarchy() {
  const layoutMap = {};
  nodes.forEach(n => {
    if (n.type === 'layout') {
      const dirPath = path.join(APP_DIR, path.dirname(n.path));
      layoutMap[normPath(dirPath)] = n.id;
    }
  });

  nodes.forEach(n => {
    if (n.type === 'page' || n.type === 'api-route') {
      const dirPath = normPath(path.join(APP_DIR, path.dirname(n.path)));
      const layoutId = layoutMap[dirPath];
      if (layoutId) addLink(layoutId, n.id, 'renders');
    }
  });
}

// ─── Infer import/require/asset links ────────────────────────────────────────
function inferImportLinks() {
  const normalizedMap = {};
  Object.keys(fileNodesMap).forEach(k => {
    normalizedMap[normPath(k)] = fileNodesMap[k];
  });

  const CODE_EXTS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.css']);

  Object.keys(fileNodesMap).forEach(fullPath => {
    const ext = path.extname(fullPath).toLowerCase();
    if (!CODE_EXTS.has(ext)) return;
    let stat;
    try { stat = fs.statSync(fullPath); } catch { return; }
    if (stat.isDirectory()) return;

    let content;
    try { content = fs.readFileSync(fullPath, 'utf8'); } catch { return; }

    const srcId = fileNodesMap[fullPath];
    const importRe = /(?:import|export)\s[^'"]*?from\s['"]([^'"]+)['"]|(?:require|import)\s*\(\s*['"]([^'"]+)['"]\s*\)|(?:src|href|action)=['"]([^'"]+)['"]/g;
    let m;
    while ((m = importRe.exec(content)) !== null) {
      const raw = m[1] || m[2] || m[3];
      if (!raw) continue;

      let targetId = null;

      if (raw.startsWith('.')) {
        const base = normPath(path.resolve(path.dirname(fullPath), raw));
        const tries = ['', '.ts', '.tsx', '.js', '.jsx', '.css',
          '/index.ts', '/index.tsx', '/index.js'];
        for (const e of tries) {
          if (normalizedMap[base + e]) { targetId = normalizedMap[base + e]; break; }
        }
      } else if (raw.startsWith('@/')) {
        const base = normPath(path.join(APP_DIR, 'src', raw.slice(2)));
        const tries = ['', '.ts', '.tsx', '.js', '.jsx', '.css',
          '/index.ts', '/index.tsx', '/index.js'];
        for (const e of tries) {
          if (normalizedMap[base + e]) { targetId = normalizedMap[base + e]; break; }
        }
      } else if (raw.startsWith('/') && !raw.startsWith('//')) {
        const base = normPath(path.join(APP_DIR, 'public', raw.slice(1)));
        if (normalizedMap[base]) targetId = normalizedMap[base];
      }

      if (targetId && targetId !== srcId) {
        const relation = raw.startsWith('/') ? 'assets' : 'imports';
        addLink(srcId, targetId, relation);
      }
    }
  });
}

// ─── Generate context.json ───────────────────────────────────────────────────
function generateContext() {
  const CODE_EXTS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.css', '.json', '.md']);
  const MAX_FILE_BYTES = 30 * 1024;

  function extractExports(content, ext) {
    if (!['.ts', '.tsx', '.js', '.jsx'].includes(ext)) return [];
    const exports = new Set();
    const patterns = [
      /export\s+(?:default\s+)?(?:function|class|const|let|var|type|interface|enum)\s+(\w+)/g,
      /export\s*\{\s*([^}]+)\s*\}/g,
    ];
    patterns.forEach(re => {
      let m;
      while ((m = re.exec(content)) !== null) {
        m[1].split(',').forEach(name => {
          const trimmed = name.trim().split(/\s+as\s+/).pop().trim();
          if (trimmed && /^\w+$/.test(trimmed)) exports.add(trimmed);
        });
      }
    });
    return Array.from(exports);
  }

  const inDegree = {};
  links.forEach(l => { inDegree[l.target] = (inDegree[l.target] || 0) + 1; });

  const files = {};
  Object.keys(fileNodesMap).forEach(fullPath => {
    let stat;
    try { stat = fs.statSync(fullPath); } catch { return; }
    if (stat.isDirectory()) return;

    const ext = path.extname(fullPath).toLowerCase();
    if (!CODE_EXTS.has(ext)) return;
    if (stat.size > MAX_FILE_BYTES) return;

    const relPath = normPath(path.relative(APP_DIR, fullPath));
    const nodeId = fileNodesMap[fullPath];

    let content = '';
    try { content = fs.readFileSync(fullPath, 'utf8'); } catch { return; }

    const importedIds = links
      .filter(l => l.source === nodeId && (l.relation === 'imports' || l.relation === 'renders'))
      .map(l => {
        const n = nodes.find(x => x.id === l.target);
        return n ? n.path : l.target;
      });

    files[relPath] = {
      id: nodeId,
      type: nodes.find(n => n.id === nodeId)?.type || ext.slice(1),
      client: content.slice(0, 200).includes("'use client'") || content.slice(0, 200).includes('"use client"'),
      exports: extractExports(content, ext),
      imports: importedIds,
      importedBy: links
        .filter(l => l.target === nodeId)
        .map(l => { const n = nodes.find(x => x.id === l.source); return n ? n.path : l.source; }),
      content,
    };
  });

  const ROOT_CONFIGS = ['tsconfig.json', 'package.json', 'next.config.ts', 'next.config.js', 'components.json'];
  ROOT_CONFIGS.forEach(cfg => {
    const fullPath = path.join(APP_DIR, cfg);
    if (!fs.existsSync(fullPath)) return;
    try {
      const content = fs.readFileSync(fullPath, 'utf8');
      files[cfg] = { type: 'config', content };
    } catch { }
  });

  return {
    generatedAt: new Date().toISOString(),
    projectRoot: normPath(APP_DIR),
    summary: {
      totalFiles: Object.keys(files).length,
      clientComponents: Object.values(files).filter(f => f.client).length,
      pages: nodes.filter(n => n.type === 'page').map(n => n.path),
      layouts: nodes.filter(n => n.type === 'layout').map(n => n.path),
      apiRoutes: nodes.filter(n => n.type === 'api-route').map(n => n.path),
    },
    files,
  };
}

// ─── Main ────────────────────────────────────────────────────────────────────
const label = APP_REL === '.' ? 'monorepo root' : APP_REL;
console.log(`Scanning ${label}...`);

SCAN_ROOTS.forEach(root => {
  const rootPath = path.join(APP_DIR, root);
  if (!fs.existsSync(rootPath)) return;
  const rootId = 'dir_' + sanitizeId(root);
  fileNodesMap[rootPath] = rootId;
  nodes.push({
    id: rootId,
    label: root + '/',
    path: root,
    color: '#ff9d00',
    size: 28,
    community: 'root',
    type: 'directory',
  });
  walkDir(rootPath, rootId);
});

console.log(`Found ${nodes.length} nodes.`);

console.log('Inferring Next.js hierarchy + import links...');
inferNextjsHierarchy();
inferImportLinks();
console.log(`Found ${links.length} links.`);

console.log('Generating context snapshot...');
const context = generateContext();

fs.mkdirSync(SNAPSHOT_DIR, { recursive: true });
const contextPath = path.join(SNAPSHOT_DIR, 'context.json');
fs.writeFileSync(contextPath, JSON.stringify(context, null, 2));
console.log(`Updated: ${contextPath} (${Object.keys(context.files).length} files snapshotted)`);

const jsonPath = path.join(SNAPSHOT_DIR, 'graph.json');
fs.writeFileSync(jsonPath, JSON.stringify({ nodes, links }, null, 2));
console.log(`Updated: ${jsonPath}`);

// Clean legacy flat files
for (const legacy of [
  path.join(GRAPHIFY_DIR, 'context.json'),
  path.join(GRAPHIFY_DIR, 'graph.json'),
]) {
  if (fs.existsSync(legacy)) {
    try { fs.unlinkSync(legacy); } catch { }
  }
}

console.log('Success! Graph synchronized with architecture.');
