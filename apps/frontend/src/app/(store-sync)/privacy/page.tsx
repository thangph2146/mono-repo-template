import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import { Button } from "@ui/components/button";
import { Database, LockKeyhole, ShieldCheck } from "lucide-react";
import { Container, Page, PageContent } from "@ui/components/layout";
import {
  STORE_CONTAINER_INSET,
  STORE_CONTAINER_MAX_DEFAULT,
  STORE_PAGE_CONTENT_CLASS,
} from "@ui/lib/layout-shell";

const privacyItems = [
  "Chỉ thu thập dữ liệu cần thiết để xử lý đơn hàng, chăm sóc đại lý và tối ưu dịch vụ.",
  "Không chia sẻ dữ liệu định danh cho bên thứ ba ngoài phạm vi thực hiện vận hành B2B.",
  "Dữ liệu đăng nhập và lịch sử giao dịch được áp dụng cơ chế bảo mật theo chuẩn nội bộ.",
  "Đại lý có quyền yêu cầu cập nhật, chỉnh sửa hoặc xóa thông tin theo quy định hiện hành.",
];

export default function PrivacyPage() {
  return (
    <Page>
      <PageContent className={STORE_PAGE_CONTENT_CLASS}>
        <section>
          <Container max={STORE_CONTAINER_MAX_DEFAULT} className={`${STORE_CONTAINER_INSET} space-y-6`}>
      <Card className="rounded-2xl border-outline-variant">
        <CardHeader className="space-y-3">
          <div className="inline-flex w-fit items-center gap-2 rounded-full bg-primary/10 text-primary px-3 py-1 text-sm font-bold">
            <LockKeyhole className="w-4 h-4" />
            Privacy Policy
          </div>
          <CardTitle className="text-4xl font-black tracking-tight">
            Chính sách bảo mật dữ liệu đại lý
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {privacyItems.map((item) => (
            <div key={item} className="rounded-xl border border-outline-variant/40 p-4 bg-surface/40">
              <p className="text-muted-foreground flex items-start gap-2">
                <Database className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <span>{item}</span>
              </p>
            </div>
          ))}
          <div className="pt-2">
            <Link href="/help" className="block w-fit">
              <Button variant="outline" className="rounded-xl">
                <ShieldCheck className="w-4 h-4 mr-2" />
                Xem hướng dẫn bảo mật tài khoản
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
