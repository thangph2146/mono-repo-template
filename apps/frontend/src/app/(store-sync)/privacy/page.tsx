import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Database, LockKeyhole, ShieldCheck } from "lucide-react";
import { Container, Page, PageContent } from "@/components/shared/layout";

const privacyItems = [
  "Chỉ thu thập dữ liệu cần thiết để xử lý đơn hàng, chăm sóc đại lý và tối ưu dịch vụ.",
  "Không chia sẻ dữ liệu định danh cho bên thứ ba ngoài phạm vi thực hiện vận hành B2B.",
  "Dữ liệu đăng nhập và lịch sử giao dịch được áp dụng cơ chế bảo mật theo chuẩn nội bộ.",
  "Đại lý có quyền yêu cầu cập nhật, chỉnh sửa hoặc xóa thông tin theo quy định hiện hành.",
];

export default function PrivacyPage() {
  return (
    <Page>
      <PageContent className="px-0 md:px-0 py-8 md:py-10 space-y-0">
        <section>
          <Container max="8xl" className="px-4 md:px-8 space-y-6">
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
            <Button asChild variant="outline" className="rounded-xl">
              <Link href="/help">
                <ShieldCheck className="w-4 h-4 mr-2" />
                Xem hướng dẫn bảo mật tài khoản
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
