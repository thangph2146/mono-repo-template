export type { AcademicYearRow, AcademicYearFormValues, AcademicYearConfirmAction, AcademicYearDetail } from "./types";
export { academicYearFormSchema } from "./types";
export { getAcademicYearColumns, getTrashColumns } from "./columns";
export {
  useAcademicYearDetailQuery,
  useAcademicYearsListQuery,
  useAcademicYearsTrashQuery,
} from "./_query";
export {
  useColumnFiltersChange,
  useClearListFilters,
  useClearTrashFilters,
  buildAcademicYearPayload,
  useAcademicYearForm,
  useHandleConfirmAction,
  useConfirmAction,
} from "./_hooks";
export { AcademicYearFormShell } from "./_form";
export { AcademicYearsConfirmDialog } from "./_alert-dialog";
export { AcademicYearsTable, AcademicYearsTrashTable } from "./_table";
