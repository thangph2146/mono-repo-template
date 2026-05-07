import Link from "next/link";
import { ArrowRight, CircleCheckBig, Truck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type OrderStatusRow = {
  id: string;
  date: string;
  statusText: string;
  etaOrTotal: string;
  status: "shipping" | "completed";
  href: string;
  ctaLabel: string;
};

export function OrderStatusTable({ rows }: { rows: OrderStatusRow[] }) {
  return (
    <Card className="border-border py-0">
      <CardContent className="p-0">
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
              <TableRow key={row.id}>
                <TableCell className="pl-6 font-bold">{row.id}</TableCell>
                <TableCell className="text-muted-foreground">{row.date}</TableCell>
                <TableCell>
                  <span
                    className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-bold ${
                      row.status === "shipping"
                        ? "bg-primary/10 text-primary"
                        : "bg-success/15 text-success"
                    }`}
                  >
                    {row.status === "shipping" ? (
                      <Truck className="w-3.5 h-3.5" />
                    ) : (
                      <CircleCheckBig className="w-3.5 h-3.5" />
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
