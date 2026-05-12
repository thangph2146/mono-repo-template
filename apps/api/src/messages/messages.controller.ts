import {
  Controller,
  Post,
  Patch,
  Body,
  Param,
  Headers,
  Res,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import { EntityManager } from '@mikro-orm/core';
import { SocketGateway } from '../socket/socket.gateway';
import {
  createSuccessResponse,
  createErrorResponse,
} from '../common/api-response';
import { Message, MessageType } from '../entities/message.entity';
import { MessageRead } from '../entities/message-read.entity';
import { GroupMember } from '../entities/group-member.entity';
import { Group } from '../entities/group.entity';
import { User } from '../entities/user.entity';
import { APP_HEADERS, ADMIN_ROUTES } from '../config/constants';

@Controller(ADMIN_ROUTES.MESSAGES)
export class MessagesController {
  private readonly logger = new Logger(MessagesController.name);

  constructor(
    private readonly em: EntityManager,
    private readonly socketGateway: SocketGateway,
  ) {}

  private getUserId(
    headers: Record<string, string | undefined>,
  ): string | null {
    const id = headers[APP_HEADERS.USER_ID]?.trim();
    return id || null;
  }

  private relationId(value: unknown): string | null {
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (
      value &&
      typeof value === 'object' &&
      'id' in value &&
      typeof (value as { id?: unknown }).id === 'string'
    ) {
      const id = (value as { id: string }).id.trim();
      return id || null;
    }
    return null;
  }

  @Patch(':id')
  async markRead(
    @Res() res: Response,
    @Headers() headers: Record<string, string | undefined>,
    @Param('id') id: string,
    @Body() body: { isRead?: boolean },
  ) {
    const userId = this.getUserId(headers);
    if (!userId) {
      const { statusCode, body: errBody } = createErrorResponse(
        `Thiếu header ${APP_HEADERS.USER_ID}`,
        { status: 401 },
      );
      return res.status(statusCode).json(errBody);
    }
    const messageId = id.trim();
    const isRead = body?.isRead === true;
    try {
      const msg = await this.em.findOne(Message, {
        id: messageId,
        deletedAt: null,
      });
      if (!msg) {
        const { statusCode, body: errBody } = createErrorResponse(
          'Không tìm thấy tin nhắn',
          { status: 404 },
        );
        return res.status(statusCode).json(errBody);
      }
      const groupId = this.relationId(msg.group);
      if (groupId) {
        if (isRead) {
          const existing = await this.em.findOne(MessageRead, {
            message: messageId,
            user: userId,
          });
          if (!existing) {
            const mr = new MessageRead();
            mr.message = this.em.getReference(Message, messageId);
            mr.user = this.em.getReference(User, userId);
            this.em.persist(mr);
            await this.em.flush();
          }
        } else {
          await this.em.nativeDelete(MessageRead, {
            message: messageId,
            user: userId,
          });
        }
      } else {
        const receiverId = this.relationId(msg.receiver);
        if (receiverId !== userId) {
          const { statusCode, body: errBody } = createErrorResponse(
            'Không có quyền cập nhật tin nhắn này',
            { status: 403 },
          );
          return res.status(statusCode).json(errBody);
        }
        msg.isRead = isRead;
        this.em.persist(msg);
        await this.em.flush();
      }
      const { statusCode, body: okBody } = createSuccessResponse(
        { isRead },
        { status: 200 },
      );
      return res.status(statusCode).json(okBody);
    } catch (err) {
      this.logger.error(
        'markRead message failed',
        err instanceof Error ? err : String(err),
      );
      const { statusCode, body: errBody } = createErrorResponse(
        'Không thể cập nhật trạng thái đọc',
        { status: 500 },
      );
      return res.status(statusCode).json(errBody);
    }
  }

  @Post()
  async send(
    @Res() res: Response,
    @Headers() headers: Record<string, string | undefined>,
    @Body()
    body: {
      content?: string;
      receiverId?: string;
      groupId?: string;
      replyToId?: string;
      type?: string;
    },
  ) {
    const senderId = this.getUserId(headers);
    if (!senderId) {
      const { statusCode, body: errBody } = createErrorResponse(
        `Thiếu header ${APP_HEADERS.USER_ID}`,
        { status: 401 },
      );
      return res.status(statusCode).json(errBody);
    }

    const content =
      typeof body?.content === 'string' ? body.content.trim() : '';
    if (!content) {
      const { statusCode, body: errBody } = createErrorResponse(
        'Nội dung tin nhắn là bắt buộc',
        { status: 400 },
      );
      return res.status(statusCode).json(errBody);
    }

    if (content.length > 10000) {
      const { statusCode, body: errBody } = createErrorResponse(
        'Nội dung tin nhắn quá dài',
        { status: 400 },
      );
      return res.status(statusCode).json(errBody);
    }

    const receiverId =
      body?.receiverId && String(body.receiverId).trim()
        ? String(body.receiverId).trim()
        : null;
    const groupId =
      body?.groupId && String(body.groupId).trim()
        ? String(body.groupId).trim()
        : null;
    const parentId =
      body?.replyToId && String(body.replyToId).trim()
        ? String(body.replyToId).trim()
        : null;

    if (!receiverId && !groupId) {
      const { statusCode, body: errBody } = createErrorResponse(
        'Cần receiverId (tin nhắn cá nhân) hoặc groupId (tin nhắn nhóm)',
        { status: 400 },
      );
      return res.status(statusCode).json(errBody);
    }

    const type =
      body?.type === 'PERSONAL' ||
      body?.type === 'ANNOUNCEMENT' ||
      body?.type === 'SYSTEM'
        ? (body.type as MessageType)
        : MessageType.PERSONAL;

    try {
      const msgObj = new Message();
      msgObj.subject = '';
      msgObj.content = content;
      msgObj.type = type;
      msgObj.sender = this.em.getReference(User, senderId);
      msgObj.receiver = receiverId
        ? this.em.getReference(User, receiverId)
        : null;
      msgObj.group = groupId ? this.em.getReference(Group, groupId) : null;
      msgObj.parent = parentId ? this.em.getReference(Message, parentId) : null;
      this.em.persist(msgObj);
      await this.em.flush();

      const created = msgObj;

      const targetUserIds: string[] = [];
      if (receiverId) {
        targetUserIds.push(receiverId);
      } else if (groupId) {
        const members = await this.em.find(GroupMember, {
          group: groupId,
          leftAt: null,
        });
        for (const m of members) {
          const memberUserId = this.relationId(m.user);
          if (typeof memberUserId === 'string' && memberUserId !== senderId) {
            targetUserIds.push(memberUserId);
          }
        }
      }
      this.socketGateway.emitMessageNew(
        {
          id: created.id,
          content: created.content,
          fromUserId: senderId,
          toUserId: receiverId ?? null,
          groupId: groupId ?? null,
          timestamp: created.createdAt.getTime(),
          replyToId: parentId ?? null,
          isRead: false,
        },
        targetUserIds,
      );

      const { statusCode, body: okBody } = createSuccessResponse(
        {
          id: created.id,
          timestamp: created.createdAt.toISOString(),
        },
        { status: 201 },
      );
      return res.status(statusCode).json(okBody);
    } catch (err) {
      this.logger.error(
        'send message failed',
        err instanceof Error ? err : String(err),
      );
      const { statusCode, body: errBody } = createErrorResponse(
        'Không thể gửi tin nhắn',
        { status: 500 },
      );
      return res.status(statusCode).json(errBody);
    }
  }
}
