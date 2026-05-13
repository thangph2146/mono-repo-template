"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { ContentCardButton } from "./content-card";
import { Button } from "@ui/components/button";
import { Container } from "@ui/components/layout";
import { Heading, Text } from "@ui/components/typography";
import { STORE_CONTAINER_INSET_WIDE, STORE_CONTAINER_MAX_DEFAULT } from "@ui/lib/layout-shell";
import { getAdminLoginUrl, getAdminRegisterUrl } from "@/features/auth/admin-bridge";
import { ScrollIndicator } from "./scroll-indicator";

export interface HeroButton extends ContentCardButton {
  responsiveText?: {
    mobile: string;
    desktop: string;
  };
}

export interface HeroSectionProps {
  title: string;
  description: string;
  flipWords?: string[];
  backgroundImage: {
    src: string;
    alt: string;
    width?: number;
    height?: number;
  };
  buttons?: HeroButton[];
  titleClassName?: string;
  descriptionClassName?: string;
  overlayClassName?: string;
  className?: string;
  children?: ReactNode;
}

export const HeroSection = ({
  title,
  description,
  flipWords,
  backgroundImage,
  buttons,
  children,
}: HeroSectionProps) => {
  const [activeWordIndex, setActiveWordIndex] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);
  const signIn = buttons?.[0]?.href ?? getAdminLoginUrl();
  const signUp = buttons?.[1]?.href ?? getAdminRegisterUrl();
  const activeWord = flipWords?.[activeWordIndex] ?? flipWords?.[0];

  useEffect(() => {
    if (!flipWords || flipWords.length <= 1) return;

    const interval = window.setInterval(() => {
      setActiveWordIndex((currentIndex) => (currentIndex + 1) % flipWords.length);
    }, 2200);

    return () => window.clearInterval(interval);
  }, [flipWords]);

  return (
    <section
      ref={sectionRef}
      className="relative isolate min-h-[calc(100vh-56px)] overflow-hidden bg-secondary"
    >
      <div className="absolute inset-0 z-0">
        <Image
          src={backgroundImage.src}
          alt={backgroundImage.alt}
          title={backgroundImage.alt}
          fill
          priority
          unoptimized
          quality={75}
          sizes="100vw"
          className="object-cover object-[center_bottom] article-image article-image-ux-impr article-image-new expandable"
        />
      </div>
      <div className="absolute inset-0 z-10 bg-gradient-to-r from-black/80 via-black/60 to-black/30" />
      <div className="absolute inset-0 z-10 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.16),transparent_42%)]" />
      <Container
        max={STORE_CONTAINER_MAX_DEFAULT}
        className={`${STORE_CONTAINER_INSET_WIDE} absolute inset-0 z-20 flex h-full items-center py-6 sm:py-12`}
      >
        <div className="relative w-full max-w-2xl space-y-4 rounded-lg border border-white/20 bg-black/60 p-8 shadow-2xl sm:p-12">
          <Heading
            as="h1"
            className="text-xl font-bold leading-tight tracking-tight text-balance text-white uppercase sm:text-2xl lg:text-3xl"
          >
            {title}
          </Heading>
          {activeWord ? (
            <div className="flex min-h-[3rem] items-center gap-3 text-2xl font-extrabold text-white sm:text-3xl lg:text-5xl">
              <span className="inline-block whitespace-nowrap px-2 transition-opacity duration-300">
                {activeWord}
              </span>
            </div>
          ) : null}
          <Text className="text-sm leading-relaxed text-balance text-white/90 sm:text-base lg:text-lg">
            {description}
          </Text>
          <div className="flex flex-wrap gap-4">
            <Link href={signIn}>
              <Button
                size="lg"
                className="min-h-[44px] min-w-[140px] rounded-lg px-8 font-semibold shadow-lg shadow-primary/30 transition-all hover:scale-105"
              >
                {buttons?.[0]?.leftIcon}
                <span className="hidden xs:inline">{buttons?.[0]?.responsiveText?.desktop ?? "Đăng nhập ngay"}</span>
                <span className="xs:hidden">{buttons?.[0]?.responsiveText?.mobile ?? "Đăng nhập"}</span>
              </Button>
            </Link>
            <Link href={signUp}>
              <Button
                variant="outline"
                size="lg"
                className="min-h-[44px] min-w-[140px] rounded-lg border-white/30 bg-white/10 px-8 font-semibold text-white transition-all hover:scale-105 hover:bg-white/20"
              >
                {buttons?.[1]?.leftIcon}
                <span className="hidden xs:inline">{buttons?.[1]?.responsiveText?.desktop ?? "Tạo tài khoản mới"}</span>
                <span className="xs:hidden">{buttons?.[1]?.responsiveText?.mobile ?? "Đăng ký"}</span>
              </Button>
            </Link>
          </div>
          {children}
        </div>
      </Container>
      <ScrollIndicator variant="light" containerRef={sectionRef} />
    </section>
  );
};
