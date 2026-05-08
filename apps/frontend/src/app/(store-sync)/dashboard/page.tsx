import { Card, CardContent } from "@ui/components/card";
import { Button } from "@ui/components/button";
import Link from "next/link";
import { Container, Page, PageContent } from "@ui/components/layout";
import { OrderStatusTable } from "@/components/shared/order-status-table";
import {
  Boxes,
  CircleCheckBig,
  Clock3,
  LifeBuoy,
  PackagePlus,
  Truck,
} from "lucide-react";

export default function DashboardPage() {
  const quickStats = [
    { label: "Đơn đang giao", value: "1", icon: Truck, tone: "text-primary bg-primary/10" },
    { label: "Đơn hoàn tất tháng này", value: "12", icon: CircleCheckBig, tone: "text-success bg-success/15" },
    { label: "Mặt hàng đã nhập", value: "356", icon: Boxes, tone: "text-amber-600 bg-amber-500/15" },
  ];

  return (
    <Page>
      <PageContent className="px-0 md:px-0 py-8 md:py-10 space-y-0">
        <section>
          <Container max="8xl" className="px-4 md:px-8 space-y-8">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">Xin chào, Cửa hàng Tạp hóa Số 1 👋</h1>
                <p className="text-lg text-muted-foreground">Tổng quan nhanh hoạt động nhập hàng hôm nay</p>
              </div>
              <Link href="/catalog">
                <Button size="lg" className="h-12 px-6 rounded-xl font-bold">
                  <PackagePlus className="w-5 h-5 mr-2" />
                  Tạo đơn nhập mới
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {quickStats.map((item) => (
                <Card key={item.label} className="border-outline-variant bg-background">
                  <CardContent className="p-5 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{item.label}</p>
                      <p className="text-3xl font-black text-foreground mt-1">{item.value}</p>
                    </div>
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${item.tone}`}>
                      <item.icon className="w-6 h-6" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <DashboardActionCard
                href="/catalog"
                title="Đặt hàng mới"
                desc="Xem danh mục và nhập sỉ hàng hóa"
                icon={PackagePlus}
                tone="bg-primary text-primary-foreground"
                emphasized
              />
              <DashboardActionCard
                href="/orders"
                title="Đơn hàng đang giao"
                desc="Theo dõi tình trạng giao hàng"
                icon={Truck}
                tone="bg-secondary text-secondary-foreground"
              />
              <DashboardActionCard
                href="/orders"
                title="Lịch sử nhập hàng"
                desc="Xem lại các đơn đã hoàn tất"
                icon={Clock3}
                tone="bg-muted text-muted-foreground"
              />
              <DashboardActionCard
                href="/support"
                title="Gọi hỗ trợ ngay"
                desc="Liên hệ tổng đài hoặc nhân viên"
                icon={LifeBuoy}
                tone="bg-accent text-accent-foreground"
              />
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-foreground">Trạng thái đơn hàng gần nhất</h2>
                <Link href="/orders" className="text-sm font-semibold text-primary hover:underline">
                  Xem tất cả đơn
                </Link>
              </div>
              <OrderStatusTable
                rows={[
                  {
                    id: "ORD-0899",
                    date: "05/05/2026",
                    statusText: "Đang giao hàng",
                    etaOrTotal: "Dự kiến nhận: Hôm nay",
                    status: "shipping",
                    href: "/orders/ORD-0899",
                    ctaLabel: "Chi tiết",
                  },
                  {
                    id: "ORD-0850",
                    date: "01/05/2026",
                    statusText: "Đã hoàn thành",
                    etaOrTotal: "Tổng: 5,400,000đ",
                    status: "completed",
                    href: "/orders/ORD-0850",
                    ctaLabel: "Mua lại",
                  },
                ]}
              />
            </div>
          </Container>
        </section>
      </PageContent>
    </Page>
  );
}

function DashboardActionCard({
  href,
  title,
  desc,
  icon: Icon,
  tone,
  emphasized = false,
}: {
  href: string;
  title: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: string;
  emphasized?: boolean;
}) {
  return (
    <Link href={href} className="block group">
      <Card className={`border-border hover:border-primary hover:shadow-level-2 transition-all cursor-pointer h-full ${emphasized ? "bg-primary/5" : ""}`}>
        <CardContent className="p-8 flex flex-col items-center text-center space-y-4">
          <div className={`${tone} p-4 rounded-full group-hover:scale-110 transition-transform`}>
            <Icon className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-bold text-foreground">{title}</h3>
          <p className="text-muted-foreground">{desc}</p>
        </CardContent>
      </Card>
    </Link>
  );
}
