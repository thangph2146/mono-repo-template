import type { PromoRulePublic } from "@workspace/promo-codes";
import { mergePromoRulesPreferDb } from "@workspace/promo-codes";

let cachedDbRules: readonly PromoRulePublic[] = [];

/** Admin / API cập nhật — `useCart` đọc qua {@link getMergedPromoRules}. */
export function setStorefrontPromoRulesFromApi(
  rules: readonly PromoRulePublic[] | null | undefined,
): void {
  cachedDbRules = rules ?? [];
}

/** Rule áp dụng trên giỏ (DB ghi đè built-in khi trùng mã). */
export function getMergedPromoRules(): PromoRulePublic[] {
  return mergePromoRulesPreferDb(cachedDbRules);
}
