import type { NotificationSettings, UserName } from "./types";

const USER_KEY = "selectedUser";
const NOTIFICATIONS_KEY = "notificationSettings";

export function loadUser(): UserName {
  const stored = localStorage.getItem(USER_KEY);
  return stored === "Kyle" ? "Kyle" : "Trevor";
}

export function saveUser(user: UserName): void {
  localStorage.setItem(USER_KEY, user);
}

export function loadNotificationSettings(): NotificationSettings {
  const stored = localStorage.getItem(NOTIFICATIONS_KEY);
  if (stored) {
    try {
      return JSON.parse(stored) as NotificationSettings;
    } catch {
      // fall through to defaults
    }
  }
  return { desktop: true, sound: true, badge: true };
}

export function saveNotificationSettings(settings: NotificationSettings): void {
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(settings));
}
