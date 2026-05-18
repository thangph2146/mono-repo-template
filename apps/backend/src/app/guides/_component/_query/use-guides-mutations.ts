"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { StoreSyncSdk } from "@workspace/api-client";
import type { GuideFormData, UpdateGuideData, GuideGroup } from "../types";
import { PAGE_KEY, parseContent } from "../utils";

interface CreateGuideVariables {
  api: StoreSyncSdk;
  data: GuideFormData;
  nextOrder: number;
}

interface UpdateGuideVariables {
  api: StoreSyncSdk;
  id: string;
  data: UpdateGuideData;
}

async function createGuide({ api, data, nextOrder }: CreateGuideVariables): Promise<void> {
  await api.guides.create({
    pageKey: PAGE_KEY,
    sectionKey: data.sectionKey,
    isVisible: data.isVisible,
    content: { ...data.content, order: nextOrder },
  });
}

async function updateGuide({ api, id, data }: UpdateGuideVariables): Promise<void> {
  await api.guides.update(id, data as unknown as Record<string, unknown>);
}

async function deleteGuide(api: StoreSyncSdk, id: string): Promise<void> {
  await api.guides.remove(id);
}

async function reorderGuides(api: StoreSyncSdk, ordered: GuideGroup[]): Promise<void> {
  for (let idx = 0; idx < ordered.length; idx++) {
    const grp = ordered[idx];
    const c = parseContent(grp.content);
    await api.guides.update(grp.id, {
      isVisible: grp.isVisible,
      content: { ...c, order: idx + 1 },
    });
  }
}

export function useCreateGuideMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createGuide,
    onSuccess: () => {
      toast.success("Đã tạo nhóm hướng dẫn");
      void queryClient.invalidateQueries({ queryKey: ["admin", "guides"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Không thể tạo nhóm");
    },
  });
}

export function useUpdateGuideMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateGuide,
    onSuccess: () => {
      toast.success("Đã cập nhật");
      void queryClient.invalidateQueries({ queryKey: ["admin", "guides"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Không thể cập nhật");
    },
  });
}

export function useDeleteGuideMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ api, id }: { api: StoreSyncSdk; id: string }) => deleteGuide(api, id),
    onSuccess: () => {
      toast.success("Đã xóa nhóm");
      void queryClient.invalidateQueries({ queryKey: ["admin", "guides"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Không thể xóa");
    },
  });
}

export function useReorderGuidesMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ api, ordered }: { api: StoreSyncSdk; ordered: GuideGroup[] }) =>
      reorderGuides(api, ordered),
    onSuccess: () => {
      toast.success("Đã lưu thứ tự");
      void queryClient.invalidateQueries({ queryKey: ["admin", "guides"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Không thể lưu thứ tự");
    },
  });
}
