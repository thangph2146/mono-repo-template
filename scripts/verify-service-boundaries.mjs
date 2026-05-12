/**
 * Kiểm tra ranh giới microservice ở tầng khai báo: package.json không được phụ thuộc
 * trực tiếp vào service khác (bổ sung cho ESLint service-boundaries trên import).
 *
 * Chạy: pnpm verify:bounds
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

/** @type {Record<string, readonly string[]>} */
const FORBIDDEN_DEPS = {
  "@api": ["@frontend", "@backend", "@ui", "@workspace/api-client"],
  "@frontend": ["@backend", "@api"],
  "@backend": ["@frontend", "@api"],
  "@workspace/api-client": ["@api", "@frontend", "@backend", "@ui"],
  "@workspace/promo-codes": [
    "@api",
    "@frontend",
    "@backend",
    "@ui",
    "@workspace/api-client",
  ],
  "@workspace/dealer-support": [
    "@api",
    "@frontend",
    "@backend",
    "@ui",
    "@workspace/api-client",
  ],
  "@ui": ["@api", "@frontend", "@backend", "@workspace/api-client"],
};

const DEP_FIELDS = [
  "dependencies",
  "devDependencies",
  "peerDependencies",
  "optionalDependencies",
];

/** @returns {string[]} */
function readWorkspacePackageJsonPaths() {
  const out = [];
  for (const seg of ["apps", "packages"]) {
    const base = join(root, seg);
    if (!existsSync(base)) continue;
    for (const ent of readdirSync(base, { withFileTypes: true })) {
      if (!ent.isDirectory()) continue;
      const p = join(base, ent.name, "package.json");
      if (existsSync(p)) out.push(p);
    }
  }
  return out;
}

function main() {
  const errors = [];
  for (const pjPath of readWorkspacePackageJsonPaths()) {
    const pkg = JSON.parse(readFileSync(pjPath, "utf8"));
    const name = pkg.name;
    if (!name || !FORBIDDEN_DEPS[name]) continue;
    const forbidden = FORBIDDEN_DEPS[name];
    for (const field of DEP_FIELDS) {
      const block = pkg[field];
      if (!block || typeof block !== "object") continue;
      for (const dep of Object.keys(block)) {
        if (forbidden.includes(dep)) {
          errors.push(
            `${name}: ${field} → "${dep}" (không được phụ thuộc trực tiếp service này).`,
          );
        }
      }
    }
  }

  if (errors.length) {
    console.error("[verify-service-boundaries] Vi phạm ranh giới package.json:\n");
    for (const e of errors) console.error(`  • ${e}`);
    console.error(
      "\nGiao tiếp giữa service: HTTP/SDK (@workspace/api-client), hoặc package trung lập (@workspace/promo-codes).",
    );
    process.exit(1);
  }
  console.log("[verify-service-boundaries] OK — không có phụ thuộc workspace cấm.");
}

main();
