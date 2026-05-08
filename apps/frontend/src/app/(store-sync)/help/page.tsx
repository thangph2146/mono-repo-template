import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import { Button } from "@ui/components/button";
import { CircleHelp, PackageSearch, ShoppingCart, UserRoundCheck } from "lucide-react";
import { Container, Page, PageContent } from "@ui/components/layout";

const quickHelp = [
  {
    title: "Cách đặt đơn sỉ đầu tiên",
    desc: "Vào trang danh mục, thêm sản phẩm vào giỏ, kiểm tra số lượng tối thiểu và tiến hành thanh toán COD.",
    href: "/catalog",
    icon: ShoppingCart,
    cta: "Đi tới danh mục",
  },
  {
    title: "Theo dõi trạng thái giao hàng",
    desc: "Mỗi đơn đều có mã theo dõi. Bạn có thể xem tiến độ giao nhận trong khu vực Đơn hàng của tôi.",
    href: "/orders",
    icon: PackageSearch,
    cta: "Xem đơn hàng",
  },
  {
    title: "Cập nhật thông tin đại lý",
    desc: "Nếu cần điều chỉnh thông tin liên hệ hoặc người nhận, liên hệ bộ phận CSKH để được cập nhật nhanh.",
    href: "/support",
    icon: UserRoundCheck,
    cta: "Liên hệ hỗ trợ",
  },
];

export default function HelpPage() {
  return (
    <Page>
      <PageContent className="px-0 md:px-0 py-8 md:py-10 space-y-0">
        <section>
          <Container max="8xl" className="px-4 md:px-8 space-y-6">
      <div className="space-y-2">
        <h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
          <CircleHelp className="w-9 h-9 text-primary" />
          Trung tâm trợ giúp
        </h1>
        <p className="text-muted-foreground text-lg">
          Hướng dẫn nhanh để đại lý thao tác đúng flow trên StoreSync B2B.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {quickHelp.map((item) => (
          <Card key={item.title} className="rounded-2xl border-outline-variant">
            <CardHeader>
              <CardTitle className="text-xl font-black leading-tight flex items-start gap-2">
                <item.icon className="w-5 h-5 text-primary mt-1 shrink-0" />
                <span>{item.title}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground min-h-20">{item.desc}</p>
              <Link href={item.href} className="block w-full">
                <Button variant="outline" className="rounded-xl w-full">
                  {item.cta}
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
          </Container>
        </section>
      </PageContent>
    </Page>
  );
}
