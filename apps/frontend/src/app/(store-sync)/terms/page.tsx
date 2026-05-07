import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileCheck2, Scale, ShieldCheck } from "lucide-react";
import { Container, Page, PageContent } from "@/components/shared/layout";

const sections = [
  {
    title: "Điều kiện tài khoản đại lý",
    content:
      "Tài khoản dùng cho mục đích nhập hàng sỉ hợp lệ. Đại lý cam kết cung cấp thông tin chính xác và chịu trách nhiệm bảo mật thông tin đăng nhập.",
  },
  {
    title: "Chính sách đặt hàng và giao nhận",
    content:
      "Đơn hàng được xác nhận theo tồn kho thực tế tại thời điểm xử lý. Thời gian giao nhận có thể thay đổi theo khu vực và điều kiện vận chuyển.",
  },
  {
    title: "Đổi trả và khiếu nại",
    content:
      "StoreSync hỗ trợ đổi trả theo chính sách từng nhóm hàng. Khiếu nại cần được gửi trong thời hạn quy định kèm chứng từ và hình ảnh liên quan.",
  },
];

export default function TermsPage() {
  return (
    <Page>
      <PageContent className="px-0 md:px-0 py-8 md:py-10 space-y-0">
        <section>
          <Container max="8xl" className="px-4 md:px-8 space-y-6">
      <Card className="rounded-2xl border-outline-variant">
        <CardHeader className="space-y-3">
          <div className="inline-flex w-fit items-center gap-2 rounded-full bg-primary/10 text-primary px-3 py-1 text-sm font-bold">
            <Scale className="w-4 h-4" />
            Terms of Service
          </div>
          <CardTitle className="text-4xl font-black tracking-tight">
            Điều khoản sử dụng StoreSync B2B
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {sections.map((section) => (
            <div key={section.title} className="rounded-xl border border-outline-variant/40 p-4 bg-surface/40">
              <p className="font-bold flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-primary" />
                {section.title}
              </p>
              <p className="mt-2 text-muted-foreground">{section.content}</p>
            </div>
          ))}
          <div className="pt-2">
            <Button asChild className="rounded-xl">
              <Link href="/support">
                <ShieldCheck className="w-4 h-4 mr-2" />
                Liên hệ hỗ trợ chính sách
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
          </Container>
        </section>
      </PageContent>
    </Page>
  );
}
