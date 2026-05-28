export type { MajorRow, MajorFormValues, MajorConfirmAction, MajorDetail } from "./types";
export { majorFormSchema } from "./types";
export { getMajorColumns, getTrashColumns } from "./columns";
export {
  useMajorDetailQuery,
  useMajorsListQuery,
  useMajorsTrashQuery,
} from "./_query";
export {
  useColumnFiltersChange,
  useClearListFilters,
  useClearTrashFilters,
  buildMajorPayload,
  useMajorForm,
  useHandleConfirmAction,
  useConfirmAction,
} from "./_hooks";
export { MajorsFormShell } from "./_form";
export { MajorsConfirmDialog } from "./_alert-dialog";
export { MajorsTable, MajorsTrashTable } from "./_table";
