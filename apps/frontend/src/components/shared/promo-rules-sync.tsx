"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { setStorefrontPromoRulesFromApi } from "@/lib/promo-rules-registry";

/**
 * Tải GET /promo-codes/public và đẩy vào registry để `useCart` tính KM đồng bộ API.
 */
export function PromoRulesSync() {
  const { data, isError } = useQuery({
    queryKey: ["promo-codes", "public"],
    queryFn: () => api.promoCodes.publicList(),
    staleTime: 60_000,
    retry: 2,
  });

  useEffect(() => {
    if (isError) {
      setStorefrontPromoRulesFromApi([]);
      return;
    }
    if (data) setStorefrontPromoRulesFromApi(data);
  }, [data, isError]);

  return null;
}
