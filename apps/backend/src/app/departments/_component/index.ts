export type { DepartmentRow, DepartmentFormValues, DepartmentConfirmAction, DepartmentDetail } from "./types";
export { departmentFormSchema } from "./types";
export { getDepartmentColumns, getTrashColumns } from "./columns";
export {
  useDepartmentDetailQuery,
  useDepartmentsListQuery,
  useDepartmentsTrashQuery,
} from "./_query";
export {
  useColumnFiltersChange,
  useClearListFilters,
  useClearTrashFilters,
  buildDepartmentPayload,
  useDepartmentForm,
  useHandleConfirmAction,
  useConfirmAction,
} from "./_hooks";
export { DepartmentFormShell } from "./_form";
export { DepartmentsConfirmDialog } from "./_alert-dialog";
export { DepartmentsTable, DepartmentsTrashTable } from "./_table";
