import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { ContactRequest } from '../entities/contact-request.entity';

export interface CreateContactRequestDto {
  name?: string;
  fullName?: string;
  email: string;
  phone?: string;
  subject?: string;
  address?: string;
  program?: string;
  major?: string;
  subscribeNewsletter?: boolean;
  subscribeConsultation?: boolean;
  content?: string;
}

@Injectable()
export class PublicContactRequestsService {
  constructor(private readonly em: EntityManager) {}

  async create(dto: CreateContactRequestDto) {
    const resolvedName = dto.name?.trim() || dto.fullName?.trim() || '';
    const hasLegacyConsultationFields = Boolean(
      dto.address ||
      dto.program ||
      dto.major ||
      dto.subscribeNewsletter ||
      dto.subscribeConsultation,
    );
    const subject = dto.subject?.trim()
      ? dto.subject.trim()
      : hasLegacyConsultationFields
        ? 'Đăng ký tư vấn tuyển sinh'
        : 'Liên hệ hỗ trợ';
    const parts: string[] = [];
    if (dto.address) parts.push(`Địa chỉ: ${dto.address}`);
    if (dto.program) parts.push(`Chương trình: ${dto.program}`);
    if (dto.major) parts.push(`Ngành: ${dto.major}`);
    if (dto.subscribeNewsletter)
      parts.push('Đăng ký nhận thông tin tuyển sinh: Có');
    if (dto.subscribeConsultation) parts.push('Đăng ký tư vấn: Có');
    if (dto.content?.trim()) parts.push(`Nội dung: ${dto.content.trim()}`);
    const content =
      parts.length > 0 ? parts.join('\n') : 'Không có nội dung thêm';

    const contact = new ContactRequest();
    contact.name = resolvedName;
    contact.email = dto.email;
    contact.phone = dto.phone?.trim() ? dto.phone.trim() : null;
    contact.subject = subject;
    contact.content = content;
    await this.em.persistAndFlush(contact);

    return {
      id: contact.id,
      message: 'Gửi liên hệ thành công. Chúng tôi sẽ phản hồi bạn sớm.',
    };
  }
}
