"use client";

import React, { useState, useEffect } from "react";
import {
  ArrowRight,
  Zap,
  TrendingUp,
  Package,
  Coffee,
  Beer,
  Utensils,
  Sparkles,
  ChevronRight,
  Flame,
  CheckCircle2,
  Network,
} from "lucide-react";
import Link from "next/link";
import {
  Page,
  PageContent,
  Container,
  Grid,
} from "@ui/components/layout";
import { Heading, Text, Badge, LiveDot } from "@ui/components/typography";
import { Button } from "@ui/components/button";
import { ProductCard } from "@/components/shared/product-card";
import { ProductWideCard } from "@/components/shared/product-wide-card";

export default function Home() {
  const [timeLeft, setTimeLeft] = useState({
    hours: 5,
    minutes: 24,
    seconds: 45,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const categories = [
    { name: "Nước giải khát", icon: <Beer className="size-6" />, count: "450+ mã hàng", color: "bg-blue-500/10 text-blue-600" },
    { name: "Thực phẩm khô", icon: <Utensils className="size-6" />, count: "800+ mã hàng", color: "bg-orange-500/10 text-orange-600" },
    { name: "Bánh kẹo", icon: <Coffee className="size-6" />, count: "320+ mã hàng", color: "bg-pink-500/10 text-pink-600" },
    { name: "Hóa mỹ phẩm", icon: <Sparkles className="size-6" />, count: "600+ mã hàng", color: "bg-purple-500/10 text-purple-600" },
    { name: "Đồ dùng cá nhân", icon: <Package className="size-6" />, count: "250+ mã hàng", color: "bg-teal-500/10 text-teal-600" },
    { name: "Gia vị & Dầu ăn", icon: <TrendingUp className="size-6" />, count: "180+ mã hàng", color: "bg-yellow-500/10 text-yellow-600" },
  ];

  const flashSaleProducts = [
    {
      id: 1,
      productId: "PROD-001",
      name: "Thùng 24 lon Coca-Cola 320ml",
      originalPrice: "210.000đ",
      salePrice: "179.000đ",
      discount: "-15%",
      sold: 85,
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuB-5MIMJYegmXMs4WyemXVbNzwCVDSBCPEE5Q45ACmYPfLmOVzjdqQv5rGqXkwG0AeU9B_RsEXVVXOXHXmjdbx_kgLpuIf3tiqUZWrUT1ISeVW4URC4pmq7dFJf6dF9ObCBU5TfdxBu0ARsPhzJ8OG_kaEPEguZYM12n-ZLvT8nL_wQxJIztupPlWNx_yUZIAfchDxZ5oDctVMM-ipK-XabO5I-rTLUuYo-kmAsbnkXehFso2IDImjDe85FcC8KRoo0T1zbvh3Z70E",
    },
    {
      id: 2,
      productId: "PROD-002",
      name: "Thùng 30 gói Mì Hảo Hảo Chua Cay",
      originalPrice: "135.000đ",
      salePrice: "109.000đ",
      discount: "-20%",
      sold: 120,
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDyrWT2YwfoQjQ8JTUUKPO3oUThhOjabvaCaigudtT2AnT4Fl9KwMhwru5roS76Xpb9l743b81FU605aOA3ISWCL-ZWih9Sg4pIypvMlyXAgQ_RvKkoFrneEL-i3fZZl66BkSVLvdjCMZefKV2Iv5gygNggGqyJyGk71dTHmnuLfv251bdNIAUbqoikJIdk8ewGjNBsBFwdHYpJkBCoFsjlT0JHTYsYcyrxj_n9aXf1ptJFDkTlRjks3OvZydi28RNe69etc6zGIDY",
    },
    {
      id: 3,
      productId: "PROD-003",
      name: "Lốc 4 hộp Sữa Vinamilk 180ml",
      originalPrice: "34.000đ",
      salePrice: "27.500đ",
      discount: "-18%",
      sold: 240,
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDO4v4rA6d4KabXIZqz7possiXK9y5KZ9P-3DLUMOQ9X2rZtoCBKSPuhI3nK9w03TVpgcEDAzqRUx-oAOeGWUQzcwvzWmWOj7wTgSbqT95MmbqwxqnRNTEewnwcq9qOia_4fZ3r1ZZ5opS5zM79rvMdD36lbmdYuROXv20RzDM0B9-a6hzPrGTS7GVmoFyHNOTBMHhZDBxwO7rydvxxIxBOu-a1kFvVWeGDh_W8AExEZ7jf7JSbrdFm4LAQOs03L5DmO9PyfC4fQhI",
    },
    {
      id: 4,
      productId: "PROD-004",
      name: "Dầu ăn Tường An Cooking Oil 1L",
      originalPrice: "52.000đ",
      salePrice: "44.500đ",
      discount: "-14%",
      sold: 64,
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBkgLbfndvipRk3_pZ5TM8pADd0a20PN-oPdnHBEbIBWl38y6HA66dHyyiOuT9pKejs16kMAWN2AGmxV2o7CxReLU2ozBr1JalwbiJ1hQaZtZDNMxizt8rFiK1RtCmggUElOsIfk4XAF88jp41vhUU2QplYB-F7FCvjTWHT8Kk8eU_7jS6Ux9s5m6CxzzyMIo78Y-H8PlEeG8Ge_GW7NONcq9VHUfBoAYILXXkOYPAUT-EWWPjUTHnladjUwdrt55KIPs4oJw2x9Pk",
    },
  ];

  return (
    <Page className="selection:bg-primary/30 scroll-smooth">
      <PageContent className="p-0 md:p-0 space-y-0">
        {/* --- Hero Section --- */}
        <section className="relative overflow-hidden pt-12 pb-24 md:pt-28 md:pb-40 bg-gradient-to-b from-primary/5 via-background to-background w-full">
          <Container max="8xl" className="px-6 md:px-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="space-y-10 animate-in fade-in slide-in-from-left duration-700">
                <Badge variant="primary" className="px-5 py-2 rounded-full text-base font-bold bg-primary/10 text-primary border-primary/20 flex w-fit items-center gap-2">
                  <LiveDot /> Hệ thống nhập hàng B2B lớn nhất VN
                </Badge>
                <Heading as="h1" size="display" className="leading-tight tracking-tighter">
                  Nâng Tầm Cửa Hàng <br />
                  <span className="bg-gradient-to-r from-primary to-teal-500 bg-clip-text text-transparent">
                    Với StoreSync B2B
                  </span>
                </Heading>
                <Text variant="muted" className="text-2xl leading-relaxed">
                  Cung cấp giải pháp nhập hàng sỉ đa dạng mặt hàng tiêu dùng từ các thương hiệu lớn với mức giá ưu đãi dành riêng cho đại lý.
                </Text>
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Link href="/catalog">
                    <Button size="lg" className="h-16 px-10 text-xl font-bold rounded-2xl bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 transition-all hover:scale-105 group">
                      Nhập hàng sỉ ngay
                      <ChevronRight className="ml-2 size-5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button variant="outline" size="lg" className="h-16 px-10 text-xl font-bold rounded-2xl border-2 border-outline-variant hover:bg-muted transition-all">
                      Đăng ký Đại lý
                    </Button>
                  </Link>
                </div>
                <div className="flex items-center gap-8 pt-8 border-t border-border/50">
                  <div className="space-y-1">
                    <Heading as="span" size="section">10k+</Heading>
                    <Text variant="small" className="uppercase tracking-widest font-bold">Đại lý tin dùng</Text>
                  </div>
                  <div className="space-y-1">
                    <Heading as="span" size="section">5000+</Heading>
                    <Text variant="small" className="uppercase tracking-widest font-bold">Mặt hàng sỉ</Text>
                  </div>
                  <div className="space-y-1">
                    <Heading as="span" size="section">24h</Heading>
                    <Text variant="small" className="uppercase tracking-widest font-bold">Giao nhận nhanh</Text>
                  </div>
                </div>
              </div>
              <div className="relative hidden lg:block animate-in fade-in slide-in-from-right duration-1000">
                <div className="absolute inset-0 bg-primary/20 blur-[120px] rounded-full scale-75 opacity-50"></div>
                <img
                  src="/storesync_b2b_hero_banner_1778054250920.png"
                  alt="StoreSync B2B"
                  className="relative z-10 w-full rounded-[2.5rem] shadow-2xl border border-white/20 transform rotate-2 hover:rotate-0 transition-transform duration-700"
                />
                <div className="absolute -bottom-6 -left-6 z-20 bg-white dark:bg-zinc-900 p-6 rounded-3xl shadow-2xl border border-border animate-bounce-subtle">
                  <div className="flex items-center gap-4">
                    <div className="bg-success/10 p-3 rounded-2xl">
                      <TrendingUp className="text-success size-8" />
                    </div>
                    <div>
                      <Text variant="small" className="font-bold">Doanh thu tăng</Text>
                      <Heading as="span" size="title">+35% mỗi tháng</Heading>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Container>
        </section>

        {/* --- Flash Sale Section --- */}
        <section className="py-24 bg-surface relative overflow-hidden w-full">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -mr-64 -mt-64"></div>
          <Container max="8xl" className="px-6 md:px-12">
            <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-16">
              <div className="space-y-6">
                <Badge className="bg-destructive/10 text-destructive border-destructive/20 font-bold px-4 py-1.5 rounded-xl flex w-fit items-center gap-2 text-base">
                  <Zap className="size-5 fill-destructive" /> Flash Sale Đại lý
                </Badge>
                <div className="flex flex-col md:flex-row md:items-center gap-8">
                  <Heading as="h2" size="display" className="tracking-tighter uppercase leading-none">Giá Sốc Giờ Vàng</Heading>
                  <div className="flex items-center gap-4 bg-background/50 backdrop-blur-sm p-2 rounded-2xl border border-border/50 shadow-sm">
                    <Text as="span" variant="body" className="text-muted-foreground font-bold ml-2">Kết thúc sau:</Text>
                    <div className="flex gap-2">
                      <div className="bg-foreground text-background px-4 py-3 rounded-xl font-black text-2xl w-16 text-center">{timeLeft.hours.toString().padStart(2, '0')}</div>
                      <span className="text-3xl font-bold text-foreground self-center">:</span>
                      <div className="bg-foreground text-background px-4 py-3 rounded-xl font-black text-2xl w-16 text-center">{timeLeft.minutes.toString().padStart(2, '0')}</div>
                      <span className="text-3xl font-bold text-foreground self-center">:</span>
                      <div className="bg-foreground text-background px-4 py-3 rounded-xl font-black text-2xl w-16 text-center">{timeLeft.seconds.toString().padStart(2, '0')}</div>
                    </div>
                  </div>
                </div>
              </div>
              <Link href="/catalog" className="text-primary font-black text-xl flex items-center gap-2 group hover:underline mb-2">
                Xem tất cả ưu đãi <ArrowRight className="size-6 group-hover:translate-x-2 transition-transform" />
              </Link>
            </div>

            <Grid cols={4} gap={8}>
              {flashSaleProducts.map((p) => (
                <ProductCard
                  key={p.id}
                  variant="flash"
                  href={`/catalog/${p.productId}`}
                  name={p.name}
                  image={p.image}
                  originalPrice={p.originalPrice}
                  price={p.salePrice}
                  discountLabel={p.discount}
                  soldText={`Đã bán ${p.sold} lốc`}
                  progressPercent={(p.sold / 300) * 100}
                  primaryCtaLabel="Xem chi tiết"
                />
              ))}
            </Grid>
          </Container>
        </section>

        {/* --- Categories Grid --- */}
        <section className="py-32 bg-background w-full">
          <Container max="8xl" className="px-6 md:px-12">
            <div className="text-center space-y-6 mb-20">
              <Heading as="h2" size="display" align="center" className="tracking-tight">
                Danh Mục <span className="text-primary">Hàng Tiêu Dùng</span>
              </Heading>
              <Text variant="lead" align="center" className="max-w-4xl mx-auto leading-relaxed">
                Khám phá hệ sinh thái hàng hóa đa dạng, đáp ứng mọi nhu cầu kinh doanh của đại lý và cửa hàng tiện lợi.
              </Text>
            </div>

            <Grid cols={6} gap={8}>
              {categories.map((cat, idx) => (
                <div key={idx} className="group cursor-pointer">
                  <div className={`aspect-square ${cat.color} rounded-[2.5rem] flex flex-col items-center justify-center gap-4 transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl group-hover:shadow-primary/5 border border-transparent group-hover:border-primary/20`}>
                    <div className="p-4 bg-white dark:bg-zinc-800 rounded-2xl shadow-sm transition-transform group-hover:rotate-12">
                      {cat.icon}
                    </div>
                    <div className="text-center px-4">
                      <Text variant="label" className="font-black tracking-tight">{cat.name}</Text>
                      <Text variant="caption" className="font-bold opacity-80 mt-1">{cat.count}</Text>
                    </div>
                  </div>
                </div>
              ))}
            </Grid>
          </Container>
        </section>

        {/* --- Most Purchased Section --- */}
        <section className="py-32 bg-surface rounded-none md:rounded-[5rem] mx-0 md:mx-6 border-y md:border border-border shadow-inner w-full md:w-[calc(100%-3rem)]">
          <Container max="8xl" className="px-6 md:px-12 w-full">
            <div className="flex flex-col lg:flex-row gap-16 items-start min-w-0 w-full">
              <div className="w-full lg:w-[380px] flex-shrink-0 space-y-10">
                <Badge className="bg-primary/10 text-primary border-primary/20 font-bold px-5 py-2 rounded-xl text-base">
                  <Flame className="size-6 fill-primary mr-2" /> Top Mua Nhiều Nhất
                </Badge>
                <Heading as="h2" size="section" className="leading-none tracking-tighter">
                  Sản phẩm <br />
                  <span className="text-primary">Bán chạy tháng 5</span>
                </Heading>
                <Text variant="lead" className="leading-relaxed">
                  Danh sách các mặt hàng đại lý nhập nhiều nhất trong tháng qua. Hàng về liên tục, cam kết date mới nhất 2026.
                </Text>
                <div className="space-y-4 pt-4">
                  {[
                    "Hàng chính hãng 100%",
                    "Giá sỉ cấp 1 tốt nhất thị trường",
                    "Hỗ trợ đổi trả trong 7 ngày",
                    "Chiết khấu thêm cho đơn hàng lớn"
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="bg-success/20 p-1 rounded-full">
                        <CheckCircle2 className="size-5 text-success" />
                      </div>
                      <Text as="span" variant="body" className="font-bold">{item}</Text>
                    </div>
                  ))}
                </div>
                <Button size="lg" variant="outline" className="h-16 px-10 text-xl font-bold rounded-2xl border-2 mt-4 hover:bg-muted group">
                  Xem bảng xếp hạng
                  <ArrowRight className="ml-2 size-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
              <div className="flex-1 min-w-0 w-full">
                <Grid cols={2} gap={8}>
                  <ProductWideCard
                    productId="PROD-003"
                    name="Thùng Sữa Tươi Vinamilk 180ml"
                    price="285.000đ"
                    sold="1.2k+ thùng"
                    image="https://lh3.googleusercontent.com/aida-public/AB6AXuDO4v4rA6d4KabXIZqz7possiXK9y5KZ9P-3DLUMOQ9X2rZtoCBKSPuhI3nK9w03TVpgcEDAzqRUx-oAOeGWUQzcwvzWmWOj7wTgSbqT95MmbqwxqnRNTEewnwcq9qOia_4fZ3r1ZZ5opS5zM79rvMdD36lbmdYuROXv20RzDM0B9-a6hzPrGTS7GVmoFyHNOTBMHhZDBxwO7rydvxxIxBOu-a1kFvVWeGDh_W8AExEZ7jf7JSbrdFm4LAQOs03L5DmO9PyfC4fQhI"
                    tag="Trending"
                  />
                  <ProductWideCard
                    productId="PROD-002"
                    name="Combo 10 Thùng Bia Tiger Crystal"
                    price="3.450.000đ"
                    sold="850 combo"
                    image="https://lh3.googleusercontent.com/aida-public/AB6AXuB-5MIMJYegmXMs4WyemXVbNzwCVDSBCPEE5Q45ACmYPfLmOVzjdqQv5rGqXkwG0AeU9B_RsEXVVXOXHXmjdbx_kgLpuIf3tiqUZWrUT1ISeVW4URC4pmq7dFJf6dF9ObCBU5TfdxBu0ARsPhzJ8OG_kaEPEguZYM12n-ZLvT8nL_wQxJIztupPlWNx_yUZIAfchDxZ5oDctVMM-ipK-XabO5I-rTLUuYo-kmAsbnkXehFso2IDImjDe85FcC8KRoo0T1zbvh3Z70E"
                    tag="Best Seller"
                  />
                  <ProductWideCard
                    productId="PROD-002"
                    name="Thùng Mì Hảo Hảo Tôm Chua Cay"
                    price="105.000đ"
                    sold="2.5k+ thùng"
                    image="https://lh3.googleusercontent.com/aida-public/AB6AXuDyrWT2YwfoQjQ8JTUUKPO3oUThhOjabvaCaigudtT2AnT4Fl9KwMhwru5roS76Xpb9l743b81FU605aOA3ISWCL-ZWih9Sg4pIypvMlyXAgQ_RvKkoFrneEL-i3fZZl66BkSVLvdjCMZefKV2Iv5gygNggGqyJyGk71dTHmnuLfv251bdNIAUbqoikJIdk8ewGjNBsBFwdHYpJkBCoFsjlT0JHTYsYcyrxj_n9aXf1ptJFDkTlRjks3OvZydi28RNe69etc6zGIDY"
                    tag="Hot Stock"
                  />
                  <ProductWideCard
                    productId="PROD-004"
                    name="Thùng Nước Tương Maggi 24 chai"
                    price="420.000đ"
                    sold="600 thùng"
                    image="https://lh3.googleusercontent.com/aida-public/AB6AXuBkgLbfndvipRk3_pZ5TM8pADd0a20PN-oPdnHBEbIBWl38y6HA66dHyyiOuT9pKejs16kMAWN2AGmxV2o7CxReLU2ozBr1JalwbiJ1hQaZtZDNMxizt8rFiK1RtCmggUElOsIfk4XAF88jp41vhUU2QplYB-F7FCvjTWHT8Kk8eU_7jS6Ux9s5m6CxzzyMIo78Y-H8PlEeG8Ge_GW7NONcq9VHUfBoAYILXXkOYPAUT-EWWPjUTHnladjUwdrt55KIPs4oJw2x9Pk"
                    tag="Top Rated"
                  />
                </Grid>
              </div>
            </div>
          </Container>
        </section>

        {/* --- Trust & Branding --- */}
        <section className="py-24 overflow-hidden bg-background w-full">
          <Container max="8xl" className="px-6 md:px-12">
            <div className="text-center mb-16 space-y-2">
              <Text variant="label" className="font-black text-primary tracking-[0.3em]">Đối tác tin cậy</Text>
              <Heading as="h3" size="title">Hợp tác cùng 100+ thương hiệu lớn</Heading>
            </div>
            <div className="flex flex-wrap justify-center gap-12 opacity-40 grayscale hover:grayscale-0 transition-all duration-700">
              {["Vinamilk", "Coca-Cola", "Unilever", "Nestle", "Pepsico", "P&G", "Masan"].map((brand, i) => (
                <Text as="div" key={i} variant="lead" className="font-black tracking-tighter hover:scale-110 transition-transform cursor-default">{brand}</Text>
              ))}
            </div>
          </Container>
        </section>

        {/* --- Final CTA --- */}
        <section className="pb-32 px-4 w-full">
          <div className="max-w-7xl mx-auto bg-primary rounded-none md:rounded-[4rem] p-12 md:p-24 text-center space-y-10 relative overflow-hidden shadow-2xl shadow-primary/30 w-full">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('/hot_sale_consumer_goods_collage_1778054273471.png')] opacity-10 bg-cover bg-center"></div>
            <div className="relative z-10 space-y-10">
              <Heading as="h2" size="display" className="text-primary-foreground leading-tight tracking-tighter">
                Sẵn sàng bùng nổ doanh số <br />
                cùng StoreSync B2B?
              </Heading>
              <Text variant="lead" align="center" className="text-primary-foreground/90 max-w-4xl mx-auto font-medium leading-relaxed">
                Đăng ký tài khoản đại lý ngay hôm nay để nhận bảng báo giá sỉ độc quyền và ưu đãi miễn phí vận chuyển cho đơn hàng đầu tiên.
              </Text>
              <div className="flex flex-col sm:flex-row gap-8 justify-center pt-8">
                <Button size="lg" className="h-20 px-12 text-3xl font-black rounded-3xl bg-white text-primary hover:bg-white/90 shadow-2xl transition-all hover:scale-105 active:scale-95">
                  Đăng ký ngay
                </Button>
                <Button size="lg" variant="outline" className="h-20 px-12 text-3xl font-black rounded-3xl border-2 border-white/20 text-foreground-primary hover:bg-white/10 hover:text-primary-foreground transition-all active:scale-95">
                  Tư vấn trực tiếp
                </Button>
              </div>
            </div>
          </div>
        </section>

        <Container max="8xl" className="py-12 px-6">
          <div className="flex justify-center">
            <Link
              href="/graph"
              className="group flex items-center gap-3 px-8 py-4 rounded-full bg-surface border border-outline-variant hover:border-primary/50 transition-all shadow-sm"
            >
              <Network className="size-6 text-primary group-hover:rotate-90 transition-transform duration-500" />
              <Text as="span" variant="body" className="font-bold text-on-surface-variant group-hover:text-primary">
                Technical Insight: View Architecture Graphify
              </Text>
              <ArrowRight className="size-5 text-outline" />
            </Link>
          </div>
        </Container>
      </PageContent>
    </Page>
  );
}
