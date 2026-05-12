import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import { Button } from "@ui/components/button";
import { FileCheck2, Scale, ShieldCheck } from "lucide-react";
import { Container, Page, PageContent } from "@ui/components/layout";
import {
  STORE_CONTAINER_INSET,
  STORE_CONTAINER_MAX_DEFAULT,
  STORE_PAGE_CONTENT_CLASS,
} from "@ui/lib/layout-shell";

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
    title: "Điều khoản Đổi trả và khiếu nại",
    content:
      "StoreSync hỗ trợ đổi trả theo chính sách từng nhóm hàng. Khiếu nại cần được gửi trong thời hạn quy định kèm chứng từ và hình ảnh liên quan.",
  },
];

export default function TermsPage() {
  return (
    <Page>
      <PageContent className={STORE_PAGE_CONTENT_CLASS}>
        <section>
          <Container max={STORE_CONTAINER_MAX_DEFAULT} className={`${STORE_CONTAINER_INSET} space-y-6`}>
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
                  <Link href="/support" className="block w-fit">
                    <Button className="rounded-xl">
                      <ShieldCheck className="w-4 h-4 mr-2" />
                      Liên hệ hỗ trợ chính sách
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </Container>
        </section>
      </PageContent>
    </Page>
  );
}
