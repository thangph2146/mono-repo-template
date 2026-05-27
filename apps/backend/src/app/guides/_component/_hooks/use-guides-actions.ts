"use client";

import { useState, useCallback } from "react";
import type { StoreSyncSdk } from "@workspace/api-client";
import type { GuideGroup, GuideFormData } from "../types";
import {
  useCreateGuideMutation,
  useUpdateGuideMutation,
  useDeleteGuideMutation,
  useReorderGuidesMutation,
} from "../_query";

interface UseGuidesActionsOptions {
  api: StoreSyncSdk;
  groups: GuideGroup[];
}

interface UseGuidesActionsReturn {
  // Form state
  formOpen: boolean;
  editTarget: GuideGroup | null;
  deleteTarget: GuideGroup | null;
  expandedId: string | null;

  // Actions
  openCreateForm: () => void;
  openEditForm: (group: GuideGroup) => void;
  closeForm: () => void;
  confirmDelete: (group: GuideGroup) => void;
  cancelDelete: () => void;
  toggleExpand: (id: string) => void;

  // Mutations
  handleSave: (data: GuideFormData) => void;
  handleDelete: () => void;
  handleReorder: (ordered: GuideGroup[]) => void;

  // Loading states
  isSaving: boolean;
  isDeleting: boolean;
  isReordering: boolean;
}

export function useGuidesActions({ api, groups }: UseGuidesActionsOptions): UseGuidesActionsReturn {
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<GuideGroup | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<GuideGroup | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const createMutation = useCreateGuideMutation();
  const updateMutation = useUpdateGuideMutation();
  const deleteMutation = useDeleteGuideMutation();
  const reorderMutation = useReorderGuidesMutation();

  const openCreateForm = useCallback(() => {
    setEditTarget(null);
    setFormOpen(true);
  }, []);

  const openEditForm = useCallback((group: GuideGroup) => {
    setEditTarget(group);
    setFormOpen(true);
  }, []);

  const closeForm = useCallback(() => {
    setFormOpen(false);
    setEditTarget(null);
  }, []);

  const confirmDelete = useCallback((group: GuideGroup) => {
    setDeleteTarget(group);
  }, []);

  const cancelDelete = useCallback(() => {
    setDeleteTarget(null);
  }, []);

  const toggleExpand = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  const handleSave = useCallback(
    (data: GuideFormData) => {
      if (editTarget) {
        updateMutation.mutate({
          api,
          id: editTarget.id,
          data: { isVisible: data.isVisible, content: data.content },
        });
      } else {
        createMutation.mutate({
          api,
          data,
          nextOrder: groups.length + 1,
        });
      }
    },
    [api, editTarget, groups.length, createMutation, updateMutation]
  );

  const handleDelete = useCallback(() => {
    if (deleteTarget) {
      deleteMutation.mutate({ api, id: deleteTarget.id });
      setDeleteTarget(null);
    }
  }, [api, deleteTarget, deleteMutation]);

  const handleReorder = useCallback(
    (ordered: GuideGroup[]) => {
      reorderMutation.mutate({ api, ordered });
    },
    [api, reorderMutation]
  );

  return {
    formOpen,
    editTarget,
    deleteTarget,
    expandedId,
    openCreateForm,
    openEditForm,
    closeForm,
    confirmDelete,
    cancelDelete,
    toggleExpand,
    handleSave,
    handleDelete,
    handleReorder,
    isSaving: createMutation.isPending || updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isReordering: reorderMutation.isPending,
  };
}
