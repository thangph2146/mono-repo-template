import Link from "next/link";
import {
  ArrowRight,
  CircleCheckBig,
  OctagonX,
  Truck,
} from "lucide-react";
import { Card, CardContent } from "@ui/components/card";
import { Button } from "@ui/components/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@ui/components/table";

export type OrderStatusTableRow = {
  /** Khóa React (vd. id số đơn); hiển thị mã đơn ở cột đầu dùng `orderCode`. */
  rowKey: string;
  orderCode: string;
  date: string;
  statusText: string;
  etaOrTotal: string;
  status: "shipping" | "completed" | "cancelled";
  href: string;
  ctaLabel: string;
};

export function OrderStatusTable({ rows }: { rows: OrderStatusTableRow[] }) {
  return (
    <Card className="border-border py-0 overflow-hidden">
      <CardContent className="p-0 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="pl-6">Mã đơn</TableHead>
              <TableHead>Ngày đặt</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Thông tin</TableHead>
              <TableHead className="text-right pr-6">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.rowKey}>
                <TableCell className="pl-6 font-bold">{row.orderCode}</TableCell>
                <TableCell className="text-muted-foreground">{row.date}</TableCell>
                <TableCell>
                  <span
                    className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-bold ${
                      row.status === "shipping"
                        ? "bg-primary/10 text-primary"
                        : row.status === "completed"
                          ? "bg-success/15 text-success"
                          : "bg-destructive/10 text-destructive"
                    }`}
                  >
                    {row.status === "shipping" ? (
                      <Truck className="w-3.5 h-3.5" />
                    ) : row.status === "completed" ? (
                      <CircleCheckBig className="w-3.5 h-3.5" />
                    ) : (
                      <OctagonX className="w-3.5 h-3.5" />
                    )}
                    {row.statusText}
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground">{row.etaOrTotal}</TableCell>
                <TableCell className="text-right pr-6">
                  <Link href={row.href}>
                    <Button variant="outline" size="sm">
                      {row.ctaLabel}
                      <ArrowRight className="w-4 h-4 ml-1.5" />
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
