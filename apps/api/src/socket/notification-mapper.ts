import type {
  SocketNotificationPayload,
  SocketNotificationKind,
} from './socket.types';

export type NotificationLike = {
  id: string;
  userId?: string;
  kind: string;
  title: string;
  description?: string | null;
  isRead: boolean;
  actionUrl?: string | null;
  metadata?: unknown;
  createdAt: Date;
  user?: { id?: string; email: string; name: string | null };
};

function extractMetadata(
  metadata: NotificationLike['metadata'],
): Record<string, unknown> | null {
  if (metadata == null) return null;
  if (typeof metadata === 'object') return metadata as Record<string, unknown>;
  if (typeof metadata === 'number' || typeof metadata === 'boolean') {
    return { value: metadata };
  }
  if (typeof metadata !== 'string') {
    return null;
  }

  try {
    return JSON.parse(metadata) as Record<string, unknown>;
  } catch {
    return { value: metadata };
  }
}

export function mapNotificationToPayload(
  notification: NotificationLike,
): SocketNotificationPayload {
  const metadata = extractMetadata(notification.metadata);

  return {
    id: notification.id,
    kind: notification.kind.toLowerCase() as SocketNotificationKind,
    title: notification.title,
    description: notification.description,
    fromUserId:
      typeof metadata?.fromUserId === 'string'
        ? metadata.fromUserId
        : undefined,
    toUserId: notification.userId,
    replyToId:
      typeof metadata?.replyToId === 'string' ? metadata.replyToId : undefined,
    timestamp: notification.createdAt.getTime(),
    read: notification.isRead,
    actionUrl: notification.actionUrl,
    metadata,
    userEmail: notification.user?.email,
    userName: notification.user?.name,
  };
}
