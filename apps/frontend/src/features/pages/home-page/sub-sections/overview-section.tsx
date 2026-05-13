"use client";

import { useRef } from "react";
import { Quote } from "lucide-react";
import { ContainerTextFlip } from "@ui/components/container-text-flip";
import { Container } from "@ui/components/layout";
import { Heading, Text } from "@ui/components/typography";
import { STORE_CONTAINER_INSET_WIDE, STORE_CONTAINER_MAX_DEFAULT } from "@ui/lib/layout-shell";
import { ScrollIndicator } from "./scroll-indicator";

export const OverviewSection = ({ className }: { className?: string }) => {
  const sectionRef = useRef<HTMLElement>(null);

  return (
    <section
      ref={sectionRef}
      className={`relative flex min-h-[calc(100vh-56px)] items-center justify-center bg-background ${className ?? ""}`}
    >
      <Container
        max={STORE_CONTAINER_MAX_DEFAULT}
        className={`${STORE_CONTAINER_INSET_WIDE} h-full w-full py-8`}
      >
        <div className="flex h-full flex-col items-center justify-center space-y-8">
          <Heading as="h2" className="text-lg font-bold sm:text-xl md:text-2xl lg:text-3xl">
            <span className="flex items-center gap-2 text-xl font-bold md:text-2xl">
              <span>Về</span>
              <ContainerTextFlip
                words={["Chúng Tôi", "Tương Lai", "Cam Kết"]}
                interval={3200}
                className="min-h-[1.5em] rounded-lg px-4 py-1 text-center text-2xl font-bold text-primary md:text-3xl"
                textClassName="px-2"
              />
            </span>
          </Heading>
          <div className="relative w-full rounded-lg bg-gradient-to-br from-primary/5 to-transparent px-9 py-6">
            <Quote className="absolute left-1 top-1 h-6 w-6 rotate-180 fill-primary/10" />
            <Text className="text-justify text-base leading-relaxed text-balance sm:text-sm md:text-lg lg:text-xl">
              Hệ thống kết nối Phụ huynh và Nhà trường được xây dựng để kiến tạo
              cầu nối, gắn kết giữa phụ huynh, gia đình và nhà trường trong suốt
              hành trình học tập của sinh viên tại trường Đại học Ngân hàng Tp. Hồ
              Chí Minh. Chúng tôi hiểu rằng sự tham gia tích cực của gia đình đóng
              vai trò quan trọng trong thành tích, tiến độ học tập của sinh viên.
              Thông qua nền tảng này, phụ huynh có thể theo dõi tiến độ học tập,
              điểm số, lịch học và lịch thi của sinh viên. Đồng thời, phụ huynh có
              thể trao đổi thông tin trực tiếp với giảng viên, cố vấn học tập và
              nhận thông báo quan trọng từ nhà trường. Chúng tôi mong muốn được
              quý phụ huynh đồng hành trong hành trình học tập, sáng tạo và trưởng
              thành của các em.
            </Text>
            <Quote className="absolute bottom-1 right-1 h-6 w-6 fill-primary/10" />
          </div>
        </div>
      </Container>
      <ScrollIndicator variant="dark" containerRef={sectionRef} />
    </section>
  );
};
