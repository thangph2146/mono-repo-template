"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@ui/components/card";
import { Container, Page, PageContent } from "@ui/components/layout";
import {
  ArrowLeft,
  Package2,
  ShoppingCart,
  Trash2,
} from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { CartLineItem } from "@/components/shared/cart-line-item";
import { CartOrderSummary } from "@/components/shared/cart-order-summary";

export default function CartPage() {
  const router = useRouter();
  const { lines, unitCount, setQuantity, remove, clear } = useCart();
  const isEmpty = lines.length === 0;

  return (
    <Page>
      <PageContent className="py-8 md:py-10">
        <Container max="6xl" className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <Button
                variant="ghost"
                onClick={() => router.back()}
                className="mb-2 text-on-surface-variant hover:text-primary -ml-2"
              >
                <ArrowLeft className="size-4 mr-1" />
                Tiếp tục mua hàng
              </Button>
              <h1 className="text-3xl md:text-4xl font-extrabold flex items-center gap-3">
                <ShoppingCart className="size-8 text-primary" />
                Giỏ hàng
              </h1>
              <p className="text-sm text-on-surface-variant mt-1">
                {isEmpty
                  ? "Chưa có sản phẩm nào trong giỏ"
                  : `${lines.length} loại · ${unitCount} đơn vị`}
              </p>
            </div>
            {!isEmpty && (
              <Button
                variant="outline"
                onClick={clear}
                className="text-destructive hover:bg-destructive/10 border-destructive/30 rounded-xl"
              >
                <Trash2 className="size-4 mr-1" />
                Xoá tất cả
              </Button>
            )}
          </div>

          {isEmpty ? (
            <div className="bg-surface border border-dashed border-outline-variant rounded-3xl p-16 text-center space-y-4">
              <Package2 className="size-20 mx-auto text-outline-variant opacity-30" />
              <h2 className="text-2xl font-bold">Giỏ hàng đang trống</h2>
              <p className="text-on-surface-variant">
                Hãy chọn sản phẩm từ danh mục để bắt đầu mua sắm.
              </p>
              <Button
                nativeButton={false}
                render={<Link href="/catalog" />}
                className="mt-2 h-12 px-8 rounded-xl font-bold"
              >
                Xem danh mục
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card className="overflow-hidden rounded-3xl border border-outline-variant bg-background shadow-sm">
                  <CardHeader className="border-b border-outline-variant bg-surface pb-5">
                    <CardTitle className="flex items-center justify-between text-2xl">
                      <span className="font-bold">
                        Sản phẩm trong giỏ ({lines.length})
                      </span>
                      <Badge className="border-primary/20 bg-primary/10 px-3 py-1 font-bold text-primary">
                        Tổng: {unitCount} đơn vị
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y divide-outline-variant/30">
                      {lines.map((line) => (
                        <CartLineItem
                          key={`${line.productId}:${line.unitType}`}
                          line={line}
                          onQuantityChange={(next) =>
                            setQuantity(line.productId, line.unitType, next)
                          }
                          onRemove={() =>
                            remove(line.productId, line.unitType)
                          }
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <aside className="lg:col-span-1">
                <CartOrderSummary variant="cart-aside" />
              </aside>
            </div>
          )}
        </Container>
      </PageContent>
    </Page>
  );
}
