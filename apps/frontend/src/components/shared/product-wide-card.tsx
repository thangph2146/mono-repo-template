"use client";

import Link from "next/link";
import { Star } from "lucide-react";
import { Heading, Text, Badge } from "@ui/components/typography";

type ProductWideCardProps = {
  productId: string;
  name: string;
  /** Giá đang bán (ưu đãi) */
  price: string;
  /** Giá ban đầu — gạch ngang khi có giá khuyến mãi thấp hơn */
  listPrice?: string;
  sold: string;
  image: string;
  tag: string;
  category?: string;
};

export function ProductWideCard({
  productId,
  name,
  price,
  listPrice,
  sold,
  image,
  tag,
  category,
}: ProductWideCardProps) {
  return (
    <Link href={`/catalog/${productId}`} className="block">
      <div className="flex items-center gap-8 bg-background p-6 rounded-[2.5rem] border border-outline-variant hover:shadow-2xl transition-all duration-300 group cursor-pointer hover:border-primary/30 w-full">
        <div className="w-40 h-40 bg-gradient-to-b from-white to-muted/20 rounded-3xl flex-shrink-0 flex items-center justify-center relative border border-outline-variant/30">
          <img
            src={image}
            alt={name}
            className="w-full h-full rounded-3xl object-cover drop-shadow-[0_10px_16px_rgba(0,0,0,0.16)] group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute -top-3 -right-3 bg-primary text-white text-xs font-black px-3 py-1.5 rounded-xl uppercase shadow-lg z-10">
            {tag}
          </div>
        </div>
        <div className="flex-1 min-w-0 flex flex-col justify-center space-y-3">
          {category && (
            <Text variant="caption" className="font-black text-primary uppercase tracking-widest">
              {category}
            </Text>
          )}
          <Heading as="h4" size="title" className="leading-tight group-hover:text-primary transition-colors line-clamp-3">
            {name}
          </Heading>
          <div className="flex items-baseline gap-2 flex-wrap">
            {listPrice && (
              <Text as="span" variant="muted" className="text-sm font-semibold line-through">
                {listPrice}
              </Text>
            )}
            <Heading as="span" size="title" className="text-primary">
              {price}
            </Heading>
            <Badge className="bg-success/10 text-success border-success/20 text-xs font-bold px-3 py-1">
              Bán chạy
            </Badge>
          </div>
          <Text variant="small" className="uppercase tracking-widest font-bold flex items-center gap-2">
            <Star className="size-5 fill-yellow-400 text-yellow-400" /> {sold} đã nhập
          </Text>
        </div>
      </div>
    </Link>
  );
}
