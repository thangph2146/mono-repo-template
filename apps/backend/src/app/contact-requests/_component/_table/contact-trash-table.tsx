import type { ColumnFiltersState, RowSelectionState, OnChangeFn } from "@tanstack/react-table";
import { FilterX, Download } from "lucide-react";
import { Button } from "@ui/components/button";
import { AdminDataTable } from "@/components/admin-data-table";
import { AdminTablePaginationFooter } from "@/components/admin-table-pagination-footer";
import { getTrashColumns } from "../columns";
import type { ContactRequest } from "../types";
import { downloadCsvFile } from "@/lib/export-csv";
import { downloadXlsxFile } from "@/lib/export-xlsx";

function parseStructuredContent(content: string | undefined): Record<string, string> {
  if (!content) return {};
  const lines = content.split('\n').filter(line => line.trim());
  const parsed: Record<string, string> = {};
  
  for (const line of lines) {
    const match = line.match(/^([^:]+):\s*(.+)$/);
    if (match) {
      const [, key, value] = match;
      parsed[key.trim()] = value.trim();
    }
  }
  
  return parsed;
}

function buildCustomExportData(data: ContactRequest[]): { headers: string[]; rows: string[][] } {
  const headers = [
    "Tên",
    "Email",
    "Tiêu đề",
    "Địa chỉ",
    "Chương trình",
    "Ngành",
    "Đăng ký nhận thông tin tuyển sinh",
    "Đăng ký tư vấn",
    "Nội dung",
    "Xóa lúc",
  ];
  
  const rows = data.map((item) => {
    const parsed = parseStructuredContent(item.content || item.message || "");
    
    return [
      item.name || "",
      item.email || "",
      item.subject || "",
      parsed["Địa chỉ"] || "",
      parsed["Chương trình"] || "",
      parsed["Ngành"] || "",
      parsed["Đăng ký nhận thông tin tuyển sinh"] || "",
      parsed["Đăng ký tư vấn"] || "",
      parsed["Nội dung"] || item.content || item.message || "",
      item.deletedAt ? new Date(item.deletedAt).toLocaleString("vi-VN") : "",
    ];
  });
  
  return { headers, rows };
}

interface ContactRequestTrashTableProps {
  data: ContactRequest[];
  isLoading: boolean;
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  columnFilters: ColumnFiltersState;
  onColumnFiltersChange: OnChangeFn<ColumnFiltersState>;
  globalFilter: string;
  onGlobalFilterChange: OnChangeFn<string>;
  selectedRowIds: RowSelectionState;
  onSelectedRowIdsChange: OnChangeFn<RowSelectionState>;
  onRestore: (contact: ContactRequest) => void;
  onPurge: (contact: ContactRequest) => void;
  busy: boolean;
  onBulkRestore: (ids: string[]) => void;
  onBulkPurge: (ids: string[]) => void;
  onClearFilters: () => void;
}

export function ContactRequestTrashTable(props: ContactRequestTrashTableProps) {
  const {
    data,
    isLoading,
    total,
    page,
    pageSize,
    onPageChange,
    onPageSizeChange,
    columnFilters,
    onColumnFiltersChange,
    globalFilter,
    onGlobalFilterChange,
    selectedRowIds,
    onSelectedRowIdsChange,
    onRestore,
    onPurge,
    busy,
    onBulkRestore,
    onBulkPurge,
    onClearFilters,
  } = props;

  const columns = getTrashColumns({ onRestore, onPurge, busy });

  const handleCsvExport = () => {
    const { headers, rows } = buildCustomExportData(data);
    downloadCsvFile("yeu-cau-lien-he-trash.csv", headers, rows);
  };

  const handleXlsxExport = () => {
    const { headers, rows } = buildCustomExportData(data);
    void downloadXlsxFile("yeu-cau-lien-he-trash.xlsx", headers, rows, "Yêu cầu trong thùng rác");
  };

  const paginationFooter = (
    <AdminTablePaginationFooter
      page={page}
      pageSize={pageSize}
      total={total}
      isLoading={isLoading}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      emptySummary="Không có yêu cầu trong thùng rác"
      itemLabel="yêu cầu"
    />
  );

  return (
    <AdminDataTable<ContactRequest>
      data={data}
      getRowId={(row) => String(row.id)}
      columns={columns}
      isLoading={isLoading}
      emptyLabel="Không có yêu cầu trong thùng rác khớp tìm kiếm."
      defaultExpandedAll={false}
      manualFiltering
      columnFilters={columnFilters}
      onColumnFiltersChange={onColumnFiltersChange}
      globalFilter={globalFilter}
      onGlobalFilterChange={onGlobalFilterChange}
      globalFilterPlaceholder="Tìm theo tên, email, tiêu đề…"
      rowSelectionEnabled
      selectedRowIds={selectedRowIds}
      onSelectedRowIdsChange={onSelectedRowIdsChange}
      bulkActions={[
        {
          id: "bulk-contact-restore",
          label: "Khôi phục đã chọn",
          variant: "default",
          onAction: async (rows) => {
            const ids = rows.map((c) => String(c.id));
            if (!ids.length) return;
            await onBulkRestore(ids);
          },
        },
        {
          id: "bulk-contact-purge",
          label: "Xóa hẳn đã chọn",
          variant: "destructive",
          onAction: async (rows) => {
            const ids = rows.map((c) => String(c.id));
            if (!ids.length) return;
            await onBulkPurge(ids);
          },
        },
      ]}
      filterToolbarExtra={
        <div className="flex flex-wrap items-end gap-2">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-muted-foreground">
              Xuất file
            </span>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={data.length === 0}
                onClick={handleCsvExport}
              >
                <Download className="size-4" />
                CSV
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={data.length === 0}
                onClick={handleXlsxExport}
              >
                <Download className="size-4" />
                Excel
              </Button>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={onClearFilters}
          >
            <FilterX className="size-4" aria-hidden />
            Xóa bộ lọc
          </Button>
        </div>
      }
      csvExport={false}
      footer={paginationFooter}
    />
  );
}
