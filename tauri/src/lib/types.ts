export type UserName = "Trevor" | "Kyle";

export interface ChatMessage {
  id: string;
  username: UserName;
  text?: string;
  edited?: boolean;
  /** Firestore server Timestamp (has toDate()) */
  timestamp?: { toDate: () => Date } | null;
  /** Backup client timestamp in ms for immediate display */
  clientTimestamp?: number;
  /** base64 data URL for attachments */
  fileData?: string;
  /** legacy remote URL attachments */
  fileURL?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
}

export interface NotificationSettings {
  desktop: boolean;
  sound: boolean;
  badge: boolean;
}
