import type {
  PageContent,
  PageContentStep,
  CreatePageContentInput,
  UpdatePageContentInput,
} from "@workspace/api-client";

/** Re-export shared types từ api-client */
export type GuideStep = PageContentStep;
export type GuideGroup = PageContent;
export type CreateGuideInput = CreatePageContentInput;
export type UpdateGuideInput = UpdatePageContentInput;

/** Types local cho UI */
export interface ListResult {
  data: GuideGroup[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface GuideFormData {
  sectionKey: string;
  isVisible: boolean;
  content: GuideGroup["content"];
}

export interface UpdateGuideData {
  isVisible: boolean;
  content: GuideGroup["content"];
}

export type GuideConfirmAction =
  | { kind: "delete"; row: GuideGroup }
  | { kind: "create"; row: null }
  | { kind: "update"; row: GuideGroup };
