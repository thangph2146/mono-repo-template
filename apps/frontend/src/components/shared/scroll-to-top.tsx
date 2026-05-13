"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { ArrowUp } from "lucide-react";
import { Button } from "@ui/components/button";
import { cn } from "@ui/lib/utils";
import { getHeaderHeight, scrollToYWithHeaderOffset } from "@/lib/scroll";

const scrollAllToTop = (behavior: ScrollBehavior = "instant") => {
  scrollToYWithHeaderOffset(0, behavior);

  const mainElement = document.querySelector("main");
  if (mainElement instanceof HTMLElement) {
    const headerHeight = getHeaderHeight();
    const nextTop = Math.max(0 - headerHeight, 0);
    mainElement.scrollTo({ top: nextTop, left: 0, behavior });
  }
};

export function ScrollToTop() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const previousPathnameRef = useRef<string | null>(null);
  const previousSearchParamsRef = useRef<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const currentSearchParams = searchParams?.toString() ?? null;
    const pathnameChanged =
      previousPathnameRef.current !== null && previousPathnameRef.current !== pathname;
    const searchParamsChanged =
      previousSearchParamsRef.current !== null &&
      previousSearchParamsRef.current !== currentSearchParams;

    if (pathnameChanged || searchParamsChanged) {
      requestAnimationFrame(() => {
        scrollAllToTop("instant");
      });
    }

    previousPathnameRef.current = pathname;
    previousSearchParamsRef.current = currentSearchParams;
  }, [pathname, searchParams]);

  useEffect(() => {
    const handleScroll = () => {
      const mainElement = document.querySelector("main");
      const mainScroll = mainElement instanceof HTMLElement ? mainElement.scrollTop : 0;
      const windowScroll = window.scrollY || window.pageYOffset;

      setIsVisible(windowScroll > 300 || mainScroll > 300);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    const mainElement = document.querySelector("main");
    if (mainElement instanceof HTMLElement) {
      mainElement.addEventListener("scroll", handleScroll, { passive: true });
    }

    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (mainElement instanceof HTMLElement) {
        mainElement.removeEventListener("scroll", handleScroll);
      }
    };
  }, []);

  return (
    <Button
      type="button"
      size="icon"
      aria-label="Cuộn lên đầu trang"
      onClick={() => scrollAllToTop("smooth")}
      className={cn(
        "fixed bottom-20 right-3 z-50 h-12 w-12 rounded-full shadow-lg transition-all duration-300",
        "bg-secondary text-secondary-foreground hover:bg-secondary/90",
        "hover:scale-110 active:scale-95",
        isVisible ? "pointer-events-auto translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
      )}
    >
      <ArrowUp className="h-5 w-5" />
    </Button>
  );
}
