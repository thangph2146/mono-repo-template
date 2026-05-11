import { createNextAppConfig } from "@workspace/eslint-config/next-app";
import { nextFrontendServiceBoundary } from "@workspace/eslint-config/service-boundaries";
export default createNextAppConfig([...nextFrontendServiceBoundary]);
