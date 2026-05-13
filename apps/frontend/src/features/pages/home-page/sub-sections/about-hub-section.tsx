"use client";

import { useRef } from "react";
import {
  ArrowRight,
  Award,
  Building2,
  GraduationCap,
  type LucideIcon,
  Users,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import { Container } from "@ui/components/layout";
import { Text } from "@ui/components/typography";
import { STORE_CONTAINER_INSET_WIDE, STORE_CONTAINER_MAX_DEFAULT } from "@ui/lib/layout-shell";
import { HOME_ROUTES } from "../constants";
import { ScrollIndicator } from "./scroll-indicator";

interface StatisticItem {
  icon: LucideIcon;
  count: number;
  suffix?: string;
  caption: string;
}

const statistics: StatisticItem[] = [
  {
    icon: Building2,
    count: 50,
    suffix: "+ năm",
    caption: "Xây dựng và phát triển",
  },
  {
    icon: GraduationCap,
    count: 500,
    suffix: "+",
    caption:
      "Giảng viên cơ hữu trong đó có 62 Giáo sư, Phó Giáo sư, 208 Tiến sĩ",
  },
  {
    icon: Users,
    count: 20000,
    suffix: "+",
    caption:
      "Sinh viên đang theo học ở các bậc đào tạo từ đại học, thạc sĩ, tiến sĩ",
  },
  {
    icon: Award,
    count: 70000,
    suffix: "+",
    caption: "Cử nhân, thạc sĩ, tiến sĩ đã được HUB đào tạo",
  },
];

export const AboutHubSection = ({ className }: { className?: string }) => {
  const sectionRef = useRef<HTMLElement>(null);

  return (
    <section
      ref={sectionRef}
      className={`relative flex w-full items-center overflow-hidden bg-secondary ${className ?? ""}`}
      style={{
        minHeight: "calc(100vh - 56px)",
      }}
    >
      <Container
        max={STORE_CONTAINER_MAX_DEFAULT}
        className={`${STORE_CONTAINER_INSET_WIDE} relative z-10 flex w-full items-center justify-center py-6 sm:py-12`}
      >
        <div className="mx-auto flex w-full max-w-7xl items-center justify-center">
          <div className="grid w-full items-center gap-8 md:grid-cols-12">
            <div className="space-y-6 md:col-span-4">
              <div className="space-y-4">
                <h2 className="text-3xl font-bold uppercase leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
                  <span>H</span>
                  <span className="text-brand-yellow">eightening</span>
                  <br />
                  <span>U</span>
                  <span className="text-brand-yellow">nique</span>
                  <br />
                  <span>B</span>
                  <span className="text-brand-yellow">rilliance</span>
                  <br />
                </h2>
                <Text className="text-sm font-semibold text-white/90 sm:text-base lg:text-lg">
                  Trường Đại học Ngân hàng Thành phố Hồ Chí Minh
                </Text>
              </div>
              <Link href={HOME_ROUTES.aboutHub}>
                <Button
                  variant="outline"
                  className="group min-h-[44px] rounded-lg border-white/70 bg-white px-4 py-2 text-[#7f0a22] shadow-sm shadow-black/5 hover:bg-white/90"
                >
                  <span className="uppercase font-semibold">VỀ HUB</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4 md:col-span-8">
              {statistics.map((stat) => (
                <Card
                  key={stat.caption}
                  className="rounded-lg border-0 bg-white text-secondary shadow-lg transition-shadow hover:shadow-xl"
                >
                  <CardHeader className="space-y-1 pb-1 pt-4">
                    <CardTitle className="flex items-center gap-2 text-lg font-bold leading-none text-secondary sm:text-2xl lg:text-3xl">
                      <stat.icon className="h-8 w-8 text-secondary md:h-10 md:w-10" strokeWidth={1.5} />
                      {stat.count.toLocaleString("vi-VN")}
                      <span className="ml-1 text-sm font-semibold text-secondary sm:text-lg">
                        {stat.suffix}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="line-clamp-3 text-xs text-gray-600 sm:text-sm lg:text-base">
                      {stat.caption}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </Container>
      <ScrollIndicator variant="light" containerRef={sectionRef} />
    </section>
  );
};
