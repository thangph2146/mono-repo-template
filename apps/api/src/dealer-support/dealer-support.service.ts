import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/core';
import {
  type DealerSupportPublicPayload,
  computeDealerSupportDiff,
  getDealerSupportPublicPayload,
  mergeDealerSupportOverrides,
} from '@workspace/dealer-support';
import { DealerSupportContent } from '../entities/dealer-support-content.entity';

function isRecord(v: unknown): v is Record<string, unknown> {
  return v != null && typeof v === 'object' && !Array.isArray(v);
}

/**
 * MikroORM / driver đôi khi trả cột JSON (hoặc SQLite `text`) dạng chuỗi — cần parse
 * để merge ghi đè, nếu không mỗi lần GET sẽ luôn như mặc định package.
 */
function normalizeOverrides(raw: unknown): Record<string, unknown> {
  if (raw == null) {
    return {};
  }
  if (typeof raw === 'string') {
    const t = raw.trim();
    if (t === '' || t === 'null') {
      return {};
    }
    try {
      const parsed: unknown = JSON.parse(t);
      return isRecord(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }
  if (typeof Buffer !== 'undefined' && Buffer.isBuffer(raw)) {
    try {
      const parsed: unknown = JSON.parse(raw.toString('utf8'));
      return isRecord(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }
  return isRecord(raw) ? raw : {};
}

function assertStringBlock(
  label: string,
  raw: unknown,
  keys: readonly string[],
): Record<string, string> {
  if (!isRecord(raw)) {
    throw new BadRequestException(`Thiếu hoặc sai kiểu: ${label}`);
  }
  const out: Record<string, string> = {};
  for (const k of keys) {
    const v = raw[k];
    if (typeof v !== 'string') {
      throw new BadRequestException(`${label}.${k} phải là chuỗi`);
    }
    if (v.length > 4000) {
      throw new BadRequestException(`${label}.${k} quá dài`);
    }
    out[k] = v;
  }
  return out;
}

function assertDealerSupportPayload(raw: unknown): DealerSupportPublicPayload {
  if (!isRecord(raw)) {
    throw new BadRequestException('Payload phải là object JSON');
  }
  const title = raw.title;
  const subtitle = raw.subtitle;
  if (typeof title !== 'string' || title.length > 400) {
    throw new BadRequestException('title không hợp lệ');
  }
  if (typeof subtitle !== 'string' || subtitle.length > 4000) {
    throw new BadRequestException('subtitle không hợp lệ');
  }
  const hotline = assertStringBlock('hotline', raw.hotline, [
    'display',
    'telHref',
    'cardTitle',
    'cardDescription',
    'hoursLine',
    'ctaLabel',
  ]);
  const zalo = assertStringBlock('zalo', raw.zalo, [
    'cardTitle',
    'cardDescription',
    'handleLine',
    'responseNote',
    'ctaLabel',
    'oaUrl',
  ]);
  const accountManager = assertStringBlock(
    'accountManager',
    raw.accountManager,
    [
      'sectionTitle',
      'leadLine',
      'namePlaceholder',
      'regionLine',
      'directPhoneLabel',
      'directPhoneDisplay',
      'directTelHref',
      'helpCtaLabel',
      'helpHrefPath',
    ],
  );
  const hotlineOut: DealerSupportPublicPayload['hotline'] = {
    display: hotline.display,
    telHref: hotline.telHref,
    cardTitle: hotline.cardTitle,
    cardDescription: hotline.cardDescription,
    hoursLine: hotline.hoursLine,
    ctaLabel: hotline.ctaLabel,
  };
  const zaloOut: DealerSupportPublicPayload['zalo'] = {
    cardTitle: zalo.cardTitle,
    cardDescription: zalo.cardDescription,
    handleLine: zalo.handleLine,
    responseNote: zalo.responseNote,
    ctaLabel: zalo.ctaLabel,
    oaUrl: zalo.oaUrl,
  };
  const accountManagerOut: DealerSupportPublicPayload['accountManager'] = {
    sectionTitle: accountManager.sectionTitle,
    leadLine: accountManager.leadLine,
    namePlaceholder: accountManager.namePlaceholder,
    regionLine: accountManager.regionLine,
    directPhoneLabel: accountManager.directPhoneLabel,
    directPhoneDisplay: accountManager.directPhoneDisplay,
    directTelHref: accountManager.directTelHref,
    helpCtaLabel: accountManager.helpCtaLabel,
    helpHrefPath: accountManager.helpHrefPath,
  };
  return {
    title,
    subtitle,
    hotline: hotlineOut,
    zalo: zaloOut,
    accountManager: accountManagerOut,
  };
}

@Injectable()
export class DealerSupportService {
  constructor(
    @InjectRepository(DealerSupportContent)
    private readonly contentRepo: EntityRepository<DealerSupportContent>,
  ) {}

  private async getRow(): Promise<DealerSupportContent> {
    const rows = await this.contentRepo.find(
      {},
      { limit: 1, orderBy: { id: 'ASC' } },
    );
    const row = rows[0];
    if (!row) {
      const em = this.contentRepo.getEntityManager();
      const created = em.create(
        DealerSupportContent,
        { overrides: {} },
        { partial: true },
      );
      await em.persistAndFlush(created);
      return created;
    }
    return row;
  }

  async getMerged(): Promise<DealerSupportPublicPayload> {
    const defaults = getDealerSupportPublicPayload();
    const row = await this.getRow();
    const o = normalizeOverrides(row.overrides);
    return mergeDealerSupportOverrides(defaults, o);
  }

  async getAdminPayload(): Promise<{
    defaults: DealerSupportPublicPayload;
    overrides: Record<string, unknown>;
    merged: DealerSupportPublicPayload;
  }> {
    const defaults = getDealerSupportPublicPayload();
    const row = await this.getRow();
    const overrides = normalizeOverrides(row.overrides);
    return {
      defaults,
      overrides,
      merged: mergeDealerSupportOverrides(defaults, overrides),
    };
  }

  async saveMerged(body: unknown): Promise<DealerSupportPublicPayload> {
    const merged = assertDealerSupportPayload(body);
    const defaults = getDealerSupportPublicPayload();
    const diff = computeDealerSupportDiff(defaults, merged);
    const row = await this.getRow();
    const em = this.contentRepo.getEntityManager();
    // `nativeUpdate` tránh trường hợp gán `overrides` + `flush` không phát sinh UPDATE (JSON / UoW).
    await em.nativeUpdate(
      DealerSupportContent,
      { id: row.id },
      { overrides: { ...diff } },
    );
    return mergeDealerSupportOverrides(defaults, diff);
  }

  async resetOverrides(): Promise<DealerSupportPublicPayload> {
    const row = await this.getRow();
    const em = this.contentRepo.getEntityManager();
    await em.nativeUpdate(
      DealerSupportContent,
      { id: row.id },
      { overrides: {} },
    );
    return getDealerSupportPublicPayload();
  }
}
