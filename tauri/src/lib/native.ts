import { openUrl } from "@tauri-apps/plugin-opener";
import { getCurrentWindow } from "@tauri-apps/api/window";

import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from "@tauri-apps/plugin-notification";

/** Open an external URL in the system default browser. */
export async function openExternal(url: string): Promise<void> {
  try {
    await openUrl(url);
  } catch (e) {
    // Fallback for non-Tauri contexts (e.g. browser dev server).
    console.error("Error opening external URL:", e);
    window.open(url, "_blank", "noopener,noreferrer");
  }
}

/** Open the macOS notification system settings pane. */
export async function openSystemNotificationSettings(): Promise<void> {
  await openExternal(
    "x-apple.systempreferences:com.apple.preference.notifications",
  );
}

/** Set the macOS dock badge count (clears when count is 0). */
export async function updateBadge(count: number): Promise<void> {
  try {
    await getCurrentWindow().setBadgeCount(count > 0 ? count : undefined);

  } catch (e) {
    console.error("Error updating badge:", e);
  }
}

/** Ensure notification permission is granted, returning the result. */
export async function ensureNotificationPermission(): Promise<boolean> {
  let granted = await isPermissionGranted();
  if (!granted) {
    const permission = await requestPermission();
    granted = permission === "granted";
  }
  return granted;
}

/** Show a native desktop notification. */
export async function notify(title: string, body: string): Promise<void> {
  if (await ensureNotificationPermission()) {
    sendNotification({ title, body });
  }
}
