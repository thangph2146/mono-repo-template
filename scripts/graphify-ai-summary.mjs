/**
 * Từ apps/<app>/.graphify/context.json tạo SUMMARY_FOR_AI.md — gọn, không nhúng full source,
 * để AI định hướng codebase (routes, import graph) mà không đốt token.
 *
 * Chạy: pnpm graphify:ai-summary
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

/** @param {string} appDir */
function summarizeApp(appDir, label) {
  const ctxPath = join(root, "apps", appDir, ".graphify", "context.json");
  const outPath = join(root, "apps", appDir, ".graphify", "SUMMARY_FOR_AI.md");
  if (!existsSync(ctxPath)) {
    console.warn(`[graphify-ai-summary] Bỏ qua ${label}: không có ${ctxPath}`);
    return;
  }

  /** @type {{ generatedAt?: string; projectRoot?: string; summary?: Record<string, unknown>; files?: Record<string, Record<string, unknown>> }} */
  const ctx = JSON.parse(readFileSync(ctxPath, "utf8"));
  const summary = ctx.summary ?? {};
  const files = ctx.files ?? {};

  const lines = [];
  lines.push(`# ${label} — tóm tắt cho AI (Graphify)`);
  lines.push("");
  lines.push(`> Tự động sinh từ \`context.json\` — **đọc file này trước**; tránh đọc full \`context.json\` (có nhúng source đầy đủ).`);
  lines.push("");
  lines.push(`- **projectRoot:** \`${ctx.projectRoot ?? "—"}\``);
  lines.push(`- **context.generatedAt:** ${ctx.generatedAt ?? "—"}`);
  lines.push("");

  lines.push("## Thống kê");
  for (const [k, v] of Object.entries(summary)) {
    if (k === "pages" || k === "layouts" || k === "apiRoutes") continue;
    lines.push(`- **${k}:** ${typeof v === "object" ? JSON.stringify(v) : v}`);
  }
  lines.push("");

  const listSection = (title, key) => {
    const arr = summary[key];
    if (!Array.isArray(arr) || arr.length === 0) return;
    lines.push(`## ${title} (${arr.length})`);
    for (const p of arr) lines.push(`- \`${p}\``);
    lines.push("");
  };
  listSection("Trang (pages)", "pages");
  listSection("Layout", "layouts");
  listSection("API routes", "apiRoutes");

  const paths = Object.keys(files).sort();

  if (appDir === "api") {
    const modules = paths.filter((p) => p.endsWith(".module.ts"));
    const controllers = paths.filter(
      (p) =>
        p.endsWith(".controller.ts") && !p.includes(".controller.spec.ts"),
    );
    const entities = paths.filter(
      (p) => p.startsWith("src/entities/") && p.endsWith(".ts"),
    );
    const migrations = paths.filter((p) =>
      p.startsWith("src/migrations/"),
    );
    if (modules.length) {
      lines.push(`## Nest — module (${modules.length})`);
      for (const p of modules) lines.push(`- \`${p}\``);
      lines.push("");
    }
    if (controllers.length) {
      lines.push(`## Nest — controller (${controllers.length})`);
      for (const p of controllers) lines.push(`- \`${p}\``);
      lines.push("");
    }
    if (entities.length) {
      lines.push(`## Entities (${entities.length})`);
      for (const p of entities) lines.push(`- \`${p}\``);
      lines.push("");
    }
    if (migrations.length) {
      lines.push(`## Migrations (${migrations.length})`);
      for (const p of migrations) lines.push(`- \`${p}\``);
      lines.push("");
    }
  }

  lines.push("## Module map (không có nội dung file)");
  lines.push("");
  lines.push("| File | Loại | Client | Exports | Imports |");
  lines.push("|------|------|--------|---------|---------|");

  for (const rel of paths) {
    const f = files[rel];
    const type = String(f.type ?? "—");
    const client = f.client === true ? "yes" : f.client === false ? "no" : "—";
    const exports = Array.isArray(f.exports) ? f.exports.join(", ") : "—";
    const imports = Array.isArray(f.imports) ? f.imports.join(", ") : "—";
    const esc = (s) =>
      String(s).replace(/\|/g, "\\|").replace(/\r?\n/g, " ").slice(0, 200);
    lines.push(`| \`${rel}\` | ${type} | ${client} | ${esc(exports)} | ${esc(imports)} |`);
  }

  lines.push("");
  lines.push("## Làm mới");
  lines.push("");
  lines.push(`- Cập nhật \`context.json\`: theo pipeline Graphify của app (vd. \`update.cjs\` / graphifyy).`);
  lines.push(`- Sau đó chạy: \`pnpm graphify:ai-summary\``);
  lines.push("");

  writeFileSync(outPath, lines.join("\n"), "utf8");
  console.log(`[graphify-ai-summary] Đã ghi ${outPath} (${paths.length} file).`);
}

summarizeApp("frontend", "Storefront — @frontend");
summarizeApp("backend", "Admin Next — @backend");
summarizeApp("api", "REST API — @api (NestJS)");
