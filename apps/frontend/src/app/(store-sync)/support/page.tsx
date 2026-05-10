import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@ui/components/card";
import { Button } from "@ui/components/button";
import { Phone, MessageCircle, User, Clock, ShieldCheck, HelpCircle } from "lucide-react";
import { Container, Page, PageContent } from "@ui/components/layout";

export default function SupportPage() {
  return (
    <Page>
      <PageContent className="px-0 md:px-0 py-8 md:py-10 space-y-0">
        <section>
          <Container max="8xl" className="px-4 md:px-8 space-y-10">
            <div className="text-center space-y-3 max-w-3xl mx-auto">
              <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
                Trung tâm hỗ trợ đại lý
              </h1>
              <p className="text-lg text-muted-foreground">
                StoreSync đồng hành cùng bạn xuyên suốt quá trình nhập hàng
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <Card className="border-outline-variant shadow-lg hover:shadow-xl transition-all duration-300 rounded-[2rem] overflow-hidden group">
                <CardHeader className="text-center pb-4 pt-10">
                  <div className="mx-auto bg-primary/10 w-28 h-28 rounded-3xl flex items-center justify-center mb-6 transition-transform group-hover:rotate-6 group-hover:scale-110 duration-300">
                    <Phone className="text-primary w-14 h-14" />
                  </div>
                  <CardTitle className="text-3xl font-black text-foreground">Gọi tổng đài</CardTitle>
                  <CardDescription className="text-xl font-medium text-muted-foreground mt-2">Hỗ trợ trực tiếp 24/7 từ nhân viên</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-6 p-10 pt-4">
                  <div className="bg-surface w-full p-6 rounded-2xl border border-outline-variant/30 text-center shadow-inner">
                    <p className="text-4xl font-black text-primary tracking-tighter">1900 1500</p>
                    <p className="text-sm font-bold text-muted-foreground mt-2 flex items-center justify-center gap-2">
                      <Clock className="w-4 h-4" />
                      Làm việc từ 7h00 - 22h00
                    </p>
                  </div>
                  <Button size="lg" className="w-full h-20 text-2xl font-black rounded-2xl shadow-xl bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95 transition-all flex gap-3">
                    <Phone className="w-7 h-7" />
                    BẤM ĐỂ GỌI NGAY
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-outline-variant shadow-lg hover:shadow-xl transition-all duration-300 rounded-[2rem] overflow-hidden group">
                <CardHeader className="text-center pb-4 pt-10">
                  <div className="mx-auto bg-emerald-500/10 w-28 h-28 rounded-3xl flex items-center justify-center mb-6 transition-transform group-hover:-rotate-6 group-hover:scale-110 duration-300">
                    <MessageCircle className="text-emerald-600 w-14 h-14" />
                  </div>
                  <CardTitle className="text-3xl font-black text-foreground">Nhắn tin Zalo</CardTitle>
                  <CardDescription className="text-xl font-medium text-muted-foreground mt-2">Gửi hình ảnh sự cố hoặc đơn hàng</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-6 p-10 pt-4">
                  <div className="bg-surface w-full p-6 rounded-2xl border border-outline-variant/30 text-center shadow-inner">
                    <p className="text-3xl font-black text-emerald-600 uppercase tracking-tight">Zalo OA StoreSync</p>
                    <p className="text-sm font-bold text-muted-foreground mt-2 flex items-center justify-center gap-2">
                      <ShieldCheck className="w-4 h-4" />
                      Phản hồi nhanh trong 5 phút
                    </p>
                  </div>
                  <Button size="lg" className="w-full h-20 text-2xl font-black rounded-2xl bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm active:scale-95 transition-all flex gap-3">
                    <MessageCircle className="w-7 h-7" />
                    MỞ CHAT ZALO
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="mt-16 bg-surface rounded-[2.5rem] p-10 border border-outline-variant/50 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
              <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-10">
                <div className="flex flex-col sm:flex-row items-center gap-8 text-center sm:text-left">
                  <div className="w-32 h-32 bg-primary/10 rounded-full flex items-center justify-center border-4 border-white shadow-xl overflow-hidden">
                    <div className="w-full h-full bg-primary/20 flex items-center justify-center">
                      <User className="w-16 h-16 text-primary" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-3xl font-black text-foreground leading-tight">Nhân viên phụ trách khu vực</h2>
                    <div className="flex flex-col gap-1">
                      <p className="text-2xl font-bold text-primary">Nguyễn Văn A</p>
                      <p className="text-lg font-medium text-muted-foreground">Phụ trách Đại lý khu vực Quận 1, TP.HCM</p>
                    </div>
                  </div>
                </div>

                <div className="bg-background/80 backdrop-blur-sm p-8 rounded-3xl border border-primary/20 shadow-lg text-center w-full lg:w-auto min-w-[300px]">
                  <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-2">Số điện thoại riêng</p>
                  <p className="text-3xl font-black text-foreground">0987 654 321</p>
                  <Button variant="link" className="text-primary font-bold text-lg p-0 h-auto mt-4 hover:no-underline flex items-center gap-2 mx-auto">
                    <HelpCircle className="w-5 h-5" />
                    Yêu cầu hỗ trợ ngay
                  </Button>
                </div>
              </div>
            </div>
          </Container>
        </section>
      </PageContent>
    </Page>
  );
}
