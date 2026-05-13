import { createNextAppConfig } from "@workspace/eslint-config/next-app";
import { nextBackendServiceBoundary } from "@workspace/eslint-config/service-boundaries";
export default createNextAppConfig([
  ...nextBackendServiceBoundary,
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "JSXOpeningElement[name.name=/^(h1|h2|h3|h4|h5|h6)$/]",
          message:
            "Dùng typography component từ @ui/components/typography thay cho heading tag trực tiếp.",
        },
      ],
    },
  },
]);
