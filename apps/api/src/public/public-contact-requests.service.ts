import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { ContactRequest } from '../entities/contact-request.entity';

export interface CreateContactRequestDto {
  fullName: string;
  phone: string;
  email: string;
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
    const subject = 'Đăng ký tư vấn tuyển sinh';
    const parts: string[] = [];
    if (dto.address) parts.push(`Địa chỉ: ${dto.address}`);
    if (dto.program) parts.push(`Chương trình: ${dto.program}`);
    if (dto.major) parts.push(`Ngành: ${dto.major}`);
    if (dto.subscribeNewsletter)
      parts.push('Đăng ký nhận thông tin tuyển sinh: Có');
    if (dto.subscribeConsultation) parts.push('Đăng ký tư vấn: Có');
    if (dto.content) parts.push(`Nội dung: ${dto.content}`);
    const content =
      parts.length > 0 ? parts.join('\n') : 'Không có nội dung thêm';

    const contact = new ContactRequest();
    contact.name = dto.fullName;
    contact.email = dto.email;
    contact.phone = dto.phone;
    contact.subject = subject;
    contact.content = content;
    await this.em.persistAndFlush(contact);

    return {
      id: contact.id,
      message: 'Đăng ký thành công. Chúng tôi sẽ liên hệ bạn sớm.',
    };
  }
}
