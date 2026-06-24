import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";

export interface UpdateInfo {
  version: string;
  notes: string;
  apply: () => Promise<void>;
}

/**
 * Check GitHub releases for a newer version. Returns update info with an
 * apply() that downloads, installs, and relaunches; or null if up to date.
 */
export async function checkForUpdate(): Promise<UpdateInfo | null> {
  const update = await check();
  if (!update) return null;

  return {
    version: update.version,
    notes: update.body ?? "",
    apply: async () => {
      await update.downloadAndInstall();
      await relaunch();
    },
  };
}
