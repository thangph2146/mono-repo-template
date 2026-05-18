// Re-export shared types từ @workspace/api-client
export type {
  PageContent,
  PageContentStep,
  CreatePageContentInput,
  UpdatePageContentInput,
  // Aliases cho Guides
  GuideStep,
  GuideGroup,
  CreateGuideInput,
  UpdateGuideInput,
} from "@workspace/api-client";

// Local types cho UI
export type {
  ListResult,
  GuideFormData,
  UpdateGuideData,
  GuideConfirmAction,
} from "./types";

// Utils
export {
  PAGE_KEY,
  parseContent,
  apiBase,
  authHeaders,
  uploadImage,
  sortGroupsByOrder,
  reorderSteps,
} from "./utils";

// Hooks
export { useGuidesActions } from "./_hooks";
export { useGuideForm, buildGuidePayload, guideFormSchema } from "./_hooks";
export type { GuideFormValues } from "./_hooks";

// Query hooks
export {
  useGuidesQuery,
  useGuideDetailQuery,
  useCreateGuideMutation,
  useUpdateGuideMutation,
  useDeleteGuideMutation,
  useReorderGuidesMutation,
} from "./_query";

// Form components
export { GuideFormShell, StepEditor, ImageUploadField } from "./_form";

// Alert dialog components
export { GuidesConfirmDialog } from "./_alert-dialog";

// Table components
export { GuidesTable } from "./_table";
export { getGuidesColumns, type GuideColumnsProps } from "./columns";
