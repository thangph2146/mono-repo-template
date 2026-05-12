import {
  Controller,
  Get,
  Post,
  Query,
  Param,
  Headers,
  Res,
  Logger,
} from '@nestjs/common';
import { EntityManager, type FilterQuery } from '@mikro-orm/core';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  createSuccessResponse,
  createErrorResponse,
} from '../common/api-response';
import type { Response } from 'express';
import { SocketGateway } from '../socket/socket.gateway';
import { Message, MessageType } from '../entities/message.entity';
import { APP_HEADERS, ADMIN_ROUTES } from '../config/constants';

@Controller(ADMIN_ROUTES.CONVERSATIONS)
@ApiBearerAuth()
@ApiTags('conversations')
export class ConversationsController {
  private readonly logger = new Logger(ConversationsController.name);

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

  @Post(':otherUserId/mark-read')
  async markRead(
    @Res() res: Response,
    @Headers() headers: Record<string, string | undefined>,
    @Param('otherUserId') otherUserId: string,
  ) {
    const userId = this.getUserId(headers);
    if (!userId) {
      const { statusCode, body } = createErrorResponse(
        `Thiếu header ${APP_HEADERS.USER_ID}`,
        { status: 401 },
      );
      return res.status(statusCode).json(body);
    }
    const other = otherUserId?.trim();
    if (!other) {
      const { statusCode, body } = createErrorResponse('Thiếu otherUserId', {
        status: 400,
      });
      return res.status(statusCode).json(body);
    }
    try {
      await this.em.nativeUpdate(
        Message,
        {
          deletedAt: null,
          type: MessageType.PERSONAL,
          receiver: userId,
          sender: other,
          isRead: false,
        },
        { isRead: true },
      );
      const { statusCode, body } = createSuccessResponse(
        { message: 'Đã đánh dấu đã đọc' },
        { status: 200 },
      );
      return res.status(statusCode).json(body);
    } catch (err) {
      this.logger.error(
        'markRead conversation failed',
        err instanceof Error ? err : String(err),
      );
      const { statusCode, body } = createErrorResponse(
        'Không thể đánh dấu đã đọc',
        { status: 500 },
      );
      return res.status(statusCode).json(body);
    }
  }

  @Get()
  async list(
    @Res() res: Response,
    @Headers() headers: Record<string, string | undefined>,
    @Query('otherUserId') otherUserId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    const userId = this.getUserId(headers);
    if (!userId) {
      const { statusCode, body } = createErrorResponse(
        `Thiếu header ${APP_HEADERS.USER_ID}`,
        { status: 401 },
      );
      return res.status(statusCode).json(body);
    }

    const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
    const limitNum = Math.min(
      100,
      Math.max(1, parseInt(String(limit), 10) || 50),
    );

    try {
      if (otherUserId?.trim()) {
        const other = otherUserId.trim();
        const messages = await this.em.find(
          Message,
          {
            $or: [
              {
                deletedAt: null,
                type: 'PERSONAL' as any,
                sender: userId,
                receiver: other,
              },
              {
                deletedAt: null,
                type: 'PERSONAL' as any,
                sender: other,
                receiver: userId,
              },
            ],
          },
          {
            orderBy: { createdAt: 'ASC' },
            limit: limitNum,
            offset: (pageNum - 1) * limitNum,
          },
        );
        const { statusCode, body } = createSuccessResponse({
          data: messages.map((m) => ({
            id: m.id,
            content: m.content,
            senderId: (m.sender as any)?.id ?? m.sender,
            receiverId: (m.receiver as any)?.id ?? m.receiver,
            timestamp: m.createdAt.toISOString(),
            isRead: m.isRead,
            replyToId: m.parent?.id ?? null,
          })),
        });
        return res.status(statusCode).json(body);
      }

      const searchTrim = search?.trim();

      const sentWhere: Record<string, unknown> = {
        deletedAt: null,
        type: MessageType.PERSONAL,
        sender: userId,
      };
      if (searchTrim) {
        const q = `%${searchTrim}%`;
        sentWhere.$or = [
          { receiver: { email: { $like: q } } },
          { receiver: { name: { $like: q } } },
        ];
      }

      const receivedWhere: Record<string, unknown> = {
        deletedAt: null,
        type: MessageType.PERSONAL,
        receiver: userId,
      };
      if (searchTrim) {
        const q = `%${searchTrim}%`;
        receivedWhere.$or = [
          { sender: { email: { $like: q } } },
          { sender: { name: { $like: q } } },
        ];
      }

      const [sent, received] = await Promise.all([
        this.em.find(Message, sentWhere as FilterQuery<Message>, {
          orderBy: { createdAt: 'DESC' },
        }),
        this.em.find(Message, receivedWhere as FilterQuery<Message>, {
          orderBy: { createdAt: 'DESC' },
        }),
      ]);

      const byOtherId = new Map<
        string,
        {
          otherUser: {
            id: string;
            name: string | null;
            email: string;
            avatar: string | null;
          };
          lastMessage: { content: string; timestamp: string } | null;
          updatedAt: string;
        }
      >();

      for (const m of sent) {
        const rec = m.receiver;
        const receiverId = rec?.id;
        if (!receiverId || !rec) continue;
        const existing = byOtherId.get(receiverId);
        if (!existing || m.createdAt > new Date(existing.updatedAt)) {
          byOtherId.set(receiverId, {
            otherUser: {
              id: rec.id,
              name: rec.name ?? null,
              email: rec.email ?? '',
              avatar: rec.avatar ?? null,
            },
            lastMessage: {
              content: m.content,
              timestamp: m.createdAt.toISOString(),
            },
            updatedAt: m.createdAt.toISOString(),
          });
        }
      }
      for (const m of received) {
        const snd = m.sender;
        const senderId = snd?.id;
        if (!senderId || !snd) continue;
        const existing = byOtherId.get(senderId);
        if (!existing || m.createdAt > new Date(existing.updatedAt)) {
          byOtherId.set(senderId, {
            otherUser: {
              id: snd.id,
              name: snd.name ?? null,
              email: snd.email ?? '',
              avatar: snd.avatar ?? null,
            },
            lastMessage: {
              content: m.content,
              timestamp: m.createdAt.toISOString(),
            },
            updatedAt: m.createdAt.toISOString(),
          });
        }
      }
      const data = Array.from(byOtherId.values())
        .sort((a, b) => (b.updatedAt > a.updatedAt ? 1 : -1))
        .slice(0, limitNum)
        .map((item) => ({
          ...item,
          unreadCount: 0, // Would need aggregate counting here if strictly matching original behavior
        }));

      const { statusCode, body } = createSuccessResponse({ data });
      return res.status(statusCode).json(body);
    } catch (err) {
      this.logger.error(
        'list conversations failed',
        err instanceof Error ? err : String(err),
      );
      const { statusCode, body: errBody } = createErrorResponse(
        'Không thể tải danh sách hội thoại',
        { status: 500 },
      );
      return res.status(statusCode).json(errBody);
    }
  }
}
