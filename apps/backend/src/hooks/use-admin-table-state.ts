"use client";

import { useState, useEffect, useCallback } from "react";
import type { ColumnFiltersState, RowSelectionState, OnChangeFn } from "@tanstack/react-table";
import { useDebouncedValue } from "./use-debounced-value";

export type AdminTableTab = "list" | "trash";

export type UseAdminTableStateOptions = {
  debounceMs?: number;
  defaultPageSize?: number;
};

export type UseAdminTableStateReturn = {
  // Tab state
  mainTab: AdminTableTab;
  setMainTab: (tab: AdminTableTab) => void;

  // Pagination - List
  page: number;
  setPage: (page: number) => void;
  pageSize: number;
  setPageSize: (size: number) => void;

  // Pagination - Trash
  trashPage: number;
  setTrashPage: (page: number) => void;
  trashPageSize: number;
  setTrashPageSize: (size: number) => void;

  // Search/Filter - List
  globalFilter: string;
  setGlobalFilter: OnChangeFn<string>;
  debouncedGlobalFilter: string;

  // Search/Filter - Trash
  trashGlobalFilter: string;
  setTrashGlobalFilter: OnChangeFn<string>;
  debouncedTrashGlobalFilter: string;

  // Column filters
  columnFilters: ColumnFiltersState;
  setColumnFilters: OnChangeFn<ColumnFiltersState>;
  handleColumnFiltersChange: OnChangeFn<ColumnFiltersState>;

  // Selection
  listSelection: RowSelectionState;
  setListSelection: OnChangeFn<RowSelectionState>;
  trashSelection: RowSelectionState;
  setTrashSelection: OnChangeFn<RowSelectionState>;

  // Reset functions
  resetListPagination: () => void;
  resetTrashPagination: () => void;
  clearSelections: () => void;
};

export function useAdminTableState(
  options: UseAdminTableStateOptions = {}
): UseAdminTableStateReturn {
  const { debounceMs = 350, defaultPageSize = 15 } = options;

  // Tab state
  const [mainTab, setMainTab] = useState<AdminTableTab>("list");

  // Pagination - List
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  // Pagination - Trash
  const [trashPage, setTrashPage] = useState(1);
  const [trashPageSize, setTrashPageSize] = useState(defaultPageSize);

  // Search/Filter - List
  const [globalFilter, setGlobalFilter] = useState("");
  const debouncedGlobalFilter = useDebouncedValue(globalFilter, debounceMs);

  // Search/Filter - Trash
  const [trashGlobalFilter, setTrashGlobalFilter] = useState("");
  const debouncedTrashGlobalFilter = useDebouncedValue(trashGlobalFilter, debounceMs);

  // Column filters
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  // Selection
  const [listSelection, setListSelection] = useState<RowSelectionState>({});
  const [trashSelection, setTrashSelection] = useState<RowSelectionState>({});

  // Reset page when filters/search/pageSize change
  useEffect(() => {
    setPage(1);
  }, [debouncedGlobalFilter, pageSize, columnFilters]);

  useEffect(() => {
    setTrashPage(1);
  }, [debouncedTrashGlobalFilter, trashPageSize]);

  // Clear selection when tab changes
  useEffect(() => {
    setListSelection({});
    setTrashSelection({});
  }, [mainTab]);

  const handleColumnFiltersChange = useCallback<OnChangeFn<ColumnFiltersState>>(
    (updater) => {
      setColumnFilters((prev) =>
        typeof updater === "function" ? updater(prev) : updater
      );
    },
    []
  );

  const resetListPagination = useCallback(() => {
    setPage(1);
  }, []);

  const resetTrashPagination = useCallback(() => {
    setTrashPage(1);
  }, []);

  const clearSelections = useCallback(() => {
    setListSelection({});
    setTrashSelection({});
  }, []);

  return {
    mainTab,
    setMainTab,
    page,
    setPage,
    pageSize,
    setPageSize,
    trashPage,
    setTrashPage,
    trashPageSize,
    setTrashPageSize,
    globalFilter,
    setGlobalFilter,
    debouncedGlobalFilter,
    trashGlobalFilter,
    setTrashGlobalFilter,
    debouncedTrashGlobalFilter,
    columnFilters,
    setColumnFilters,
    handleColumnFiltersChange,
    listSelection,
    setListSelection,
    trashSelection,
    setTrashSelection,
    resetListPagination,
    resetTrashPagination,
    clearSelections,
  };
}
