// ─── Socket Event Names ────────────────────────────────────────────────────

export enum SocketEvent {
  // Connection
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  JOIN_ROOM = 'join_room',
  LEAVE_ROOM = 'leave_room',

  // Notifications
  NOTIFICATION_NEW = 'notification:new',
  NOTIFICATION_READ = 'notification:read',

  // Orders (seller <-> buyer contact)
  ORDER_STATUS_UPDATE = 'order:status_update',
  ORDER_CONTACT_SHARED = 'order:contact_shared',

  // Forum
  POST_NEW_COMMENT = 'forum:new_comment',
  POST_LIKED = 'forum:post_liked',

  // Chat (seller contacts buyer after order)
  CHAT_MESSAGE = 'chat:message',
  CHAT_TYPING = 'chat:typing',

  // Presence
  USER_ONLINE = 'presence:online',
  USER_OFFLINE = 'presence:offline',
}

// ─── Notification Types ────────────────────────────────────────────────────

export enum NotificationType {
  ORDER_PLACED = 'ORDER_PLACED',
  ORDER_CONFIRMED = 'ORDER_CONFIRMED',
  ORDER_SHIPPED = 'ORDER_SHIPPED',
  ORDER_DELIVERED = 'ORDER_DELIVERED',
  ORDER_CANCELLED = 'ORDER_CANCELLED',
  PAYMENT_SUCCESS = 'PAYMENT_SUCCESS',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  FORUM_COMMENT = 'FORUM_COMMENT',
  FORUM_LIKE = 'FORUM_LIKE',
  SELLER_CONTACT = 'SELLER_CONTACT',
  ADMIN_ANNOUNCEMENT = 'ADMIN_ANNOUNCEMENT',
  PRODUCT_APPROVED = 'PRODUCT_APPROVED',
  PRODUCT_REJECTED = 'PRODUCT_REJECTED',
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  metadata?: Record<string, string | number>;  // orderId, postId etc.
  createdAt: Date;
}

// ─── Socket Payloads ───────────────────────────────────────────────────────

export interface ChatMessage {
  id: string;
  roomId: string;               // orderId used as chat room
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  createdAt: Date;
}

export interface TypingIndicator {
  roomId: string;
  userId: string;
  userName: string;
  isTyping: boolean;
}

export interface OrderStatusUpdatePayload {
  orderId: string;
  status: string;
  buyerId: string;
  sellerId: string;
  updatedAt: Date;
}
