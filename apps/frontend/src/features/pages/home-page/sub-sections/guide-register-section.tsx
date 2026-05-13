"use client";

import { useRef } from "react";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@ui/components/card";
import { Button } from "@ui/components/button";
import { Container } from "@ui/components/layout";
import Link from "next/link";
import { cn } from "@ui/lib/utils";
import { STORE_CONTAINER_INSET_WIDE, STORE_CONTAINER_MAX_DEFAULT } from "@ui/lib/layout-shell";
import { HOME_ROUTES } from "../constants";
import { ScrollIndicator } from "./scroll-indicator";

const DEFAULT_IMAGE_HEIGHT =
  "h-[180px] xs:h-[210px] sm:h-[250px] md:h-[280px] lg:h-[320px] xl:h-[400px]";

const GUIDE_DATA = {
  title: "Hướng dẫn Phụ huynh",
  description: "Tài liệu và hướng dẫn chi tiết giúp Quý phụ huynh dễ dàng tiếp cận và sử dụng các tiện ích của hệ thống.",
  image: {
    src: "https://fileserver2.hub.edu.vn/IMAGES/2024/12/31/20241231170332vehub.jpg",
    alt: "Hướng dẫn cho phụ huynh",
  },
  button: {
    href: HOME_ROUTES.help,
    text: "Xem hướng dẫn",
    variant: "outline" as const,
  },
} as const;

const REGISTER_DATA = {
  title: "Đăng ký nhận tin",
  description: "Để lại thông tin để nhận các bản tin quan trọng, thông báo sự kiện và hoạt động của trường sớm nhất.",
  image: {
    src: "https://hub.edu.vn/DATA/IMAGES/2025/06/06/20250606095214z6676928339374_824596735893cad9e9d4402075fcccd2.jpg",
    alt: "Đăng ký nhận tin tức",
  },
  button: {
    href: HOME_ROUTES.signUp,
    text: "Đăng ký ngay",
    variant: "default" as const,
  },
} as const;

interface CardWithImageProps {
  title: string;
  description: string;
  image: { src: string; alt: string };
  button?: { href: string; text: string; variant: "default" | "outline" };
  reverse?: boolean;
}

const CardWithImage = ({ title, description, image, button, reverse = false }: CardWithImageProps) => {
  return (
    <div className="h-full min-w-0">
      <div
        className={cn(
          "flex h-full min-w-0 flex-col gap-4 sm:gap-5 lg:flex-row lg:items-center lg:gap-8",
          reverse && "lg:flex-row-reverse",
        )}
      >
        <div className="group/card order-2 w-full min-w-0 flex-1 lg:order-1 lg:max-w-lg xl:max-w-xl">
          <div className="rounded-lg bg-gradient-to-br from-primary/20 via-border to-primary/10 p-px transition-all duration-300 group-hover/card:from-primary/40 group-hover/card:to-primary/20">
            <Card className="w-full rounded-lg border-0 bg-background/95 py-5 shadow-lg backdrop-blur-sm transition-shadow group-hover/card:shadow-xl sm:py-6">
              <CardHeader className="gap-2 px-4 sm:px-5 md:px-6">
                <CardTitle className="text-base font-bold leading-tight sm:text-lg md:text-xl xl:text-2xl">
                  {title}
                </CardTitle>
                <CardDescription className="text-sm leading-relaxed text-muted-foreground sm:text-[0.95rem] md:text-base xl:text-lg">
                  {description}
                </CardDescription>
              </CardHeader>
              {button ? (
                <CardContent className="px-4 sm:px-5 md:px-6">
                  <Link href={button.href} prefetch={false}>
                    <Button
                      variant={button.variant}
                      size="sm"
                      className="min-h-[44px] w-full rounded-lg px-3 text-xs leading-relaxed hover:scale-[1.02] sm:w-auto md:px-4 md:text-sm"
                    >
                      <span className="inline-flex items-center gap-2">
                        <span>{button.text}</span>
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </Button>
                  </Link>
                </CardContent>
              ) : null}
            </Card>
          </div>
        </div>
        <div
          className={cn(
            "group relative order-1 w-full overflow-hidden rounded-lg shadow-xl lg:order-2 lg:flex-1",
            DEFAULT_IMAGE_HEIGHT,
          )}
        >
          <Image
            src={image.src}
            alt={image.alt}
            title={image.alt}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110 article-image article-image-ux-impr article-image-new expandable"
            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 90vw, 50vw"
            unoptimized
            loading="eager"
            quality={75}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
        </div>
      </div>
    </div>
  );
};

export const GuideRegisterSection = ({ className }: { className?: string }) => {
  const sectionRef = useRef<HTMLElement>(null);

  return (
    <section
      ref={sectionRef}
      className={cn(
        "relative flex min-h-[calc(100vh-56px)] items-center bg-background",
        className
      )}
    >
      <Container
        max={STORE_CONTAINER_MAX_DEFAULT}
        className={`${STORE_CONTAINER_INSET_WIDE} grid h-full w-full items-stretch gap-6 py-6 sm:gap-8 sm:py-8 xl:grid-cols-2`}
      >
        <CardWithImage
          title={GUIDE_DATA.title}
          description={GUIDE_DATA.description}
          image={GUIDE_DATA.image}
          button={GUIDE_DATA.button}
        />
        <CardWithImage
          title={REGISTER_DATA.title}
          description={REGISTER_DATA.description}
          image={REGISTER_DATA.image}
          button={REGISTER_DATA.button}
          reverse
        />
      </Container>
      <ScrollIndicator variant="dark" containerRef={sectionRef} />
    </section>
  );
};
