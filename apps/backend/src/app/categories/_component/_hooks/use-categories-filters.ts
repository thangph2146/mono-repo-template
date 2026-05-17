import type { ColumnFiltersState, OnChangeFn } from "@tanstack/react-table";
import { useCallback } from "react";

export function useColumnFiltersChange(
  setColumnFilters: React.Dispatch<React.SetStateAction<ColumnFiltersState>>
) {
  return useCallback<OnChangeFn<ColumnFiltersState>>(
    (updater) => {
      setColumnFilters((prev) =>
        typeof updater === "function" ? updater(prev) : updater
      );
    },
    [setColumnFilters]
  );
}

export function useClearListFilters(
  setColumnFilters: React.Dispatch<React.SetStateAction<ColumnFiltersState>>,
  setGlobalFilter: React.Dispatch<React.SetStateAction<string>>
) {
  return useCallback(() => {
    setColumnFilters([]);
    setGlobalFilter("");
  }, [setColumnFilters, setGlobalFilter]);
}

export function useClearTrashFilters(
  setTrashGlobalFilter: React.Dispatch<React.SetStateAction<string>>,
  setTrashColumnFilters: React.Dispatch<React.SetStateAction<ColumnFiltersState>>
) {
  return useCallback(() => {
    setTrashGlobalFilter("");
    setTrashColumnFilters([]);
  }, [setTrashGlobalFilter, setTrashColumnFilters]);
}
