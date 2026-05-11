import type { PromoRulePublic } from '@workspace/promo-codes';
import type { ApiClient } from '../client';
import type {
  CreatePromoCodeInput,
  PromoCode,
  UpdatePromoCodeInput,
} from '../types';

export type PromoCodesListOptions = {
  q?: string;
  page?: number;
  limit?: number;
};

export class PromoCodesApi {
  constructor(private readonly http: ApiClient) {}

  /** GET /promo-codes/public — rule đang hiệu lực (áp dụng trên giỏ). */
  publicList(): Promise<PromoRulePublic[]> {
    return this.http.get<PromoRulePublic[]>('/promo-codes/public');
  }

  list(
    options?: PromoCodesListOptions,
  ): Promise<PromoCode[] | { items: PromoCode[]; total: number }> {
    const p = new URLSearchParams();
    if (options?.q?.trim()) p.set('q', options.q.trim());
    if (options?.page != null) p.set('page', String(options.page));
    if (options?.limit != null) p.set('limit', String(options.limit));
    const qs = p.toString();
    return this.http.get<PromoCode[] | { items: PromoCode[]; total: number }>(
      `/promo-codes${qs ? `?${qs}` : ''}`,
    );
  }

  get(id: number): Promise<PromoCode> {
    return this.http.get<PromoCode>(`/promo-codes/${id}`);
  }

  create(input: CreatePromoCodeInput): Promise<PromoCode> {
    return this.http.post<PromoCode>('/promo-codes', input);
  }

  update(id: number, input: UpdatePromoCodeInput): Promise<PromoCode> {
    return this.http.put<PromoCode>(`/promo-codes/${id}`, input);
  }

  remove(id: number): Promise<void> {
    return this.http.delete<void>(`/promo-codes/${id}`);
  }
}
