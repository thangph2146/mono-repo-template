import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

/**
 * Shared Next.js app config for workspace apps.
 *
 * @param {import("eslint").Linter.Config[]} extraConfigs
 * @returns {import("eslint").Linter.Config[]}
 */
export function createNextAppConfig(extraConfigs = []) {
  return defineConfig([
    ...nextVitals,
    ...nextTs,
    // Override default ignores of eslint-config-next.
    globalIgnores([
      // Default ignores of eslint-config-next:
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      // Generated artifacts/scripts
      ".graphify/**",
    ]),
    {
      rules: {
        // Project uses external image URLs; opt out of next/image enforcement.
        "@next/next/no-img-element": "off",
        // Valid for query/filter sync patterns in admin/store pages.
        "react-hooks/set-state-in-effect": "off",
        // TanStack/manual memoization patterns are intentional in this repo.
        "react-hooks/preserve-manual-memoization": "off",
        "react-hooks/incompatible-library": "off",
      },
    },
    ...extraConfigs,
  ]);
}
