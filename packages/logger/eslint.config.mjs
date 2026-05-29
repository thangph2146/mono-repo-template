import { config } from "@workspace/eslint-config/base";
import { sharedTsPackageBoundary } from "@workspace/eslint-config/service-boundaries";

export default [...config, ...sharedTsPackageBoundary];
