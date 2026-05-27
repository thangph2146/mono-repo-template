import type { ColumnFiltersState, RowSelectionState, OnChangeFn } from "@tanstack/react-table";
import { FilterX, Download } from "lucide-react";
import { Button } from "@ui/components/button";
import { AdminDataTable } from "@/components/admin-data-table";
import { AdminTablePaginationFooter } from "@/components/admin-table-pagination-footer";
import { getContactRequestColumns } from "../columns";
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
    "Số điện thoại",
    "Tiêu đề",
    "Địa chỉ",
    "Chương trình",
    "Ngành",
    "Đăng ký nhận thông tin tuyển sinh",
    "Đăng ký tư vấn",
    "Nội dung",
    "Trạng thái",
    "Ưu tiên",
    "Đã đọc",
    "Người được giao",
    "Ngày tạo",
    "Ngày cập nhật",
  ];
  
  const rows = data.map((item) => {
    const parsed = parseStructuredContent(item.content || item.message || "");
    
    return [
      item.name || "",
      item.email || "",
      item.phone || "",
      item.subject || "",
      parsed["Địa chỉ"] || "",
      parsed["Chương trình"] || "",
      parsed["Ngành"] || "",
      parsed["Đăng ký nhận thông tin tuyển sinh"] || "",
      parsed["Đăng ký tư vấn"] || "",
      parsed["Nội dung"] || item.content || item.message || "",
      item.status || "",
      item.priority || "",
      item.isRead ? "Có" : "Không",
      item.assignedToName || "",
      item.createdAt ? new Date(item.createdAt).toLocaleString("vi-VN") : "",
      item.updatedAt ? new Date(item.updatedAt).toLocaleString("vi-VN") : "",
    ];
  });
  
  return { headers, rows };
}

interface ContactRequestTableProps {
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
  onView: (contact: ContactRequest) => void;
  onEdit: (contact: ContactRequest) => void;
  onDelete: (contact: ContactRequest) => void;
  busy: boolean;
  onBulkDelete: (ids: string[]) => void;
  onClearFilters: () => void;
}

export function ContactRequestTable(props: ContactRequestTableProps) {
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
    onView,
    onEdit,
    onDelete,
    busy,
    onBulkDelete,
    onClearFilters,
  } = props;

  const columns = getContactRequestColumns({ onView, onEdit, onDelete, busy });

  const handleCsvExport = () => {
    const { headers, rows } = buildCustomExportData(data);
    downloadCsvFile("yeu-cau-lien-he.csv", headers, rows);
  };

  const handleXlsxExport = () => {
    const { headers, rows } = buildCustomExportData(data);
    void downloadXlsxFile("yeu-cau-lien-he.xlsx", headers, rows, "Yêu cầu liên hệ");
  };

  const paginationFooter = (
    <AdminTablePaginationFooter
      page={page}
      pageSize={pageSize}
      total={total}
      isLoading={isLoading}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      emptySummary="Không có yêu cầu liên hệ"
      itemLabel="yêu cầu"
    />
  );

  return (
    <AdminDataTable<ContactRequest>
      data={data}
      getRowId={(row) => String(row.id)}
      columns={columns}
      isLoading={isLoading}
      emptyLabel="Không có yêu cầu liên hệ khớp tìm kiếm hoặc bộ lọc."
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
          id: "bulk-contact-delete",
          label: "Xóa tạm đã chọn",
          variant: "outline",
          className: "border-destructive/40 text-destructive",
          onAction: async (rows) => {
            const ids = rows.map((c) => String(c.id));
            if (!ids.length) return;
            await onBulkDelete(ids);
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
                size="sm"
                className="h-9 gap-1.5 rounded-lg"
                disabled={data.length === 0}
                onClick={handleCsvExport}
              >
                <Download className="size-4" />
                CSV
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 gap-1.5 rounded-lg"
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
            size="sm"
            className="h-9 gap-1.5 rounded-lg"
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
