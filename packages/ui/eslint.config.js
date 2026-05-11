import { config } from "@workspace/eslint-config/react-internal"
import { reactUiPackageBoundary } from "@workspace/eslint-config/service-boundaries"

/** @type {import("eslint").Linter.Config} */
export default [...config, ...reactUiPackageBoundary]
