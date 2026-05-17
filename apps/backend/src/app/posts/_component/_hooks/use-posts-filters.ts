import type { OnChangeFn } from "@tanstack/react-table";
import type { ColumnFiltersState } from "@tanstack/react-table";
import type { Dispatch, SetStateAction } from "react";
import { useCallback } from "react";

export function useColumnFiltersChange(
  setColumnFilters: Dispatch<SetStateAction<ColumnFiltersState>>
): OnChangeFn<ColumnFiltersState> {
  return useCallback<OnChangeFn<ColumnFiltersState>>(
    (updater) => {
      setColumnFilters((prev) =>
        typeof updater === "function" ? updater(prev) : updater,
      );
    },
    [setColumnFilters],
  );
}

export function useClearListFilters(
  setColumnFilters: Dispatch<SetStateAction<ColumnFiltersState>>,
  setGlobalFilter: Dispatch<SetStateAction<string>>
) {
  return useCallback(() => {
    setColumnFilters([]);
    setGlobalFilter("");
  }, [setColumnFilters, setGlobalFilter]);
}

export function useClearTrashFilters(
  setTrashGlobalFilter: Dispatch<SetStateAction<string>>,
  setTrashColumnFilters?: Dispatch<SetStateAction<ColumnFiltersState>>
) {
  return useCallback(() => {
    setTrashGlobalFilter("");
    setTrashColumnFilters?.([]);
  }, [setTrashGlobalFilter, setTrashColumnFilters]);
}
