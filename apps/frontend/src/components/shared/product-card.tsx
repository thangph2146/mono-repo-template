"use client";

import Link from "next/link";
import { ArrowRight, Plus, ShoppingCart, Tag } from "lucide-react";
import { Card, CardContent, CardFooter } from "@ui/components/card";
import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
import { Heading, Text } from "@ui/components/typography";

type ProductCardVariant = "catalog" | "flash";

type ProductCardProps = {
  variant: ProductCardVariant;
  href: string;
  name: string;
  image: string;
  price: string;
  originalPrice?: string;
  category?: string;
  minQty?: string;
  coupon?: string;
  discountLabel?: string;
  soldText?: string;
  progressPercent?: number;
  topRightBadge?: string;
  primaryCtaLabel?: string;
  onAddToCart?: () => void;
};

export function ProductCard({
  variant,
  href,
  name,
  image,
  price,
  originalPrice,
  category,
  minQty,
  coupon,
  discountLabel,
  soldText,
  progressPercent,
  topRightBadge = "Chính hãng",
  primaryCtaLabel = "Xem chi tiết",
  onAddToCart,
}: ProductCardProps) {
  return (
    <Card className="py-0 border-outline-variant overflow-hidden group hover:shadow-xl transition-all duration-300 bg-background rounded-2xl">
      <Link href={href} className={`block relative ${variant === "catalog" ? "w-full h-64" : "h-64"} bg-gradient-to-b from-white to-muted/20`}>
        <div className="w-full h-full rounded-2xl bg-white/70 border border-outline-variant/30 shadow-inner flex items-center justify-center overflow-hidden">
          <img
            src={image}
            alt={name}
            className="w-full h-full rounded-3xl object-cover drop-shadow-[0_10px_20px_rgba(0,0,0,0.18)] rounded-lg transition-transform duration-500 group-hover:scale-105"
          />
        </div>

        <div className="absolute top-4 right-4">
          <Badge variant="secondary" className="bg-background/90 backdrop-blur shadow-sm text-xs font-bold text-primary border border-primary/20">
            {topRightBadge}
          </Badge>
        </div>

        {coupon && variant === "catalog" && (
          <div className="absolute top-4 left-4 bg-warning/20 text-warning-foreground px-3 py-1.5 rounded-xl font-bold text-sm border border-warning/30 flex items-center gap-1.5 shadow-sm backdrop-blur-sm">
            <Tag className="w-4 h-4" />
            {coupon}
          </div>
        )}

        {discountLabel && variant === "flash" && (
          <div className="absolute top-4 left-4 bg-destructive text-white px-3 py-1.5 rounded-xl font-black text-sm shadow-lg">
            {discountLabel}
          </div>
        )}
      </Link>

      <CardContent className={`p-6 flex flex-col ${variant === "catalog" ? "h-[260px]" : "h-[245px]"} space-y-4`}>
        {category && (
          <div className="text-sm font-bold text-primary/80 uppercase tracking-widest">{category}</div>
        )}

        <Link href={href} className="group/title">
          <Heading
            as="h3"
            size="title"
            className={`line-clamp-2 leading-tight group-hover/title:text-primary transition-colors ${variant === "catalog" ? "min-h-[4rem]" : "min-h-[3.5rem]"}`}
          >
            {name}
          </Heading>
        </Link>

        <div className="mt-auto pt-4 border-t border-outline-variant/30 space-y-2">
          <div className="flex flex-wrap items-baseline gap-2">
            {originalPrice && (
              <Text variant="muted" className="line-through font-medium text-sm shrink-0">
                {originalPrice}
              </Text>
            )}
            <Heading as="span" size="title" color="primary" className="shrink-0">
              {price}
            </Heading>
          </div>

          {variant === "catalog" && minQty && (
            <div className="text-base font-bold text-primary mt-1 flex items-center gap-1">
              <Plus className="w-4 h-4" />
              {minQty}
            </div>
          )}

          {variant === "flash" && soldText && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-bold">
                <Text as="span" variant="muted">{soldText}</Text>
                <Text as="span" variant="body" className="text-primary font-bold">Hot 🔥</Text>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden border border-border/50 p-0.5">
                <div
                  className="h-full bg-gradient-to-r from-primary to-teal-500 rounded-full"
                  style={{ width: `${Math.max(0, Math.min(100, progressPercent ?? 0))}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className={variant === "catalog" ? "" : undefined}>
        <div className={`w-full flex ${variant === "catalog" ? "items-center gap-2" : ""}`}>
          <Link href={href} className={variant === "catalog" ? "flex-1" : "w-full"}>
            <Button className="w-full h-14 rounded-2xl font-bold text-lg shadow-lg hover:bg-primary/90 transition-all flex gap-2">
              <ArrowRight className="size-5" />
              {primaryCtaLabel}
            </Button>
          </Link>
          {variant === "catalog" && onAddToCart && (
            <Button
              className="h-14 w-14 rounded-2xl shadow-lg hover:scale-110 transition-all hover:bg-primary/90"
              aria-label="Thêm vào giỏ"
              onClick={onAddToCart}
            >
              <ShoppingCart className="w-7 h-7" />
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
