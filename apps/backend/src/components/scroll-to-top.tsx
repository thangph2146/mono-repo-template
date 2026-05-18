"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { cn } from "@ui/lib/utils";

const VISIBILITY_THRESHOLD = 300;

function getScrollY(): number {
  return window.scrollY ?? window.pageYOffset ?? document.documentElement.scrollTop ?? document.body.scrollTop ?? 0;
}

export function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const main = document.querySelector<HTMLElement>("main[class*='overflow-y-auto']");

    const checkScroll = () => {
      const scrollY = getScrollY();
      const mainScrollTop = main?.scrollTop ?? 0;
      setVisible(Math.max(scrollY, mainScrollTop) > VISIBILITY_THRESHOLD);
    };

    window.addEventListener("scroll", checkScroll, { passive: true });
    if (main) main.addEventListener("scroll", checkScroll, { passive: true });

    // initial check after mount
    const raf = requestAnimationFrame(checkScroll);

    return () => {
      window.removeEventListener("scroll", checkScroll);
      if (main) main.removeEventListener("scroll", checkScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  const scrollToTop = () => {
    const main = document.querySelector<HTMLElement>("main[class*='overflow-y-auto']");
    if (main && main.scrollTop > 0) {
      main.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <button
      type="button"
      aria-label="Cuộn lên đầu trang"
      onClick={scrollToTop}
      className={cn(
        "fixed bottom-6 right-6 z-50 flex size-10 items-center justify-center rounded-full bg-secondary text-secondary-foreground shadow-lg transition-all duration-300 hover:bg-secondary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        visible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-2 opacity-0",
      )}
    >
      <ArrowUp className="size-5 text-secondary-foreground" />
    </button>
  );
}
