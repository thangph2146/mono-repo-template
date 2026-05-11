import { createNextAppConfig } from "@workspace/eslint-config/next-app";
import { nextBackendServiceBoundary } from "@workspace/eslint-config/service-boundaries";
export default createNextAppConfig([...nextBackendServiceBoundary]);
