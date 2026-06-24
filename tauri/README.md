# Dumb Chat (Tauri)

A tiny two-person chat app backed by Firebase Firestore, packaged as a native
macOS app with [Tauri](https://tauri.app). This is the Tauri port of the
original Electron app (kept in `../electron`), built to drop the bundled
Chromium runtime — the result is a **~4.7 MB dmg / ~12 MB app** instead of the
~150 MB Electron build, using the system WebView (WKWebView) instead.

## Stack

- **Frontend:** SvelteKit (static adapter) + TypeScript
- **Shell:** Tauri v2 (Rust)
- **Backend:** Firebase Firestore (realtime listener)
- **Native plugins:** opener, notification, updater, process

## Project layout

```
tauri/
├── src/                       # SvelteKit frontend
│   ├── lib/
│   │   ├── firebase.ts        # Firestore init + message CRUD/subscription
│   │   ├── native.ts          # Tauri APIs: open URL, dock badge, notifications
│   │   ├── settings.ts        # localStorage persistence (user, notif prefs)
│   │   ├── format.ts          # timestamps, markdown rendering, grouping
│   │   ├── updater.ts         # GitHub-releases auto-update check
│   │   ├── theme.css          # shared CSS variables / dark theme
│   │   └── components/        # Message, MessageList, ChatInput, Settings,
│   │                          # Help, Lightbox, UpdateBanner
│   └── routes/+page.svelte    # main app shell
├── src-tauri/                 # Rust shell + config
│   ├── tauri.conf.json        # window, bundle, updater config
│   ├── capabilities/          # plugin permissions
│   └── dumbchat-updater.key*  # updater signing keypair (.key is gitignored!)
└── scripts/make-release.sh    # build + generate latest.json
```

## Development

```bash
npm install
npm run tauri dev     # launches the native window with HMR
```

To preview just the web UI in a browser (native APIs will no-op):

```bash
npm run dev           # http://localhost:1420
```

Type-check and build the frontend:

```bash
npm run check
npm run build
```

## Auto-updates

The app checks GitHub releases on launch via the Tauri updater plugin and shows
an in-app banner when a newer version is available. Clicking **Install &
Restart** downloads the signed update, verifies it, applies it in place, and
relaunches — no re-download or `xattr` quarantine dance needed.

### How signing works

This is **separate from Apple code-signing**. The updater uses a standalone
`minisign` keypair:

- `src-tauri/dumbchat-updater.key` — private key (**gitignored, never commit**)
- `src-tauri/dumbchat-updater.key.pub` — public key (embedded in `tauri.conf.json`)

The build signs the update payload with the private key; the app verifies it
with the embedded public key. The key was generated with **no password** for
convenience, so building only requires the key file to be present.

> If the private key is ever lost, generate a new one with
> `npm run tauri signer generate -p "" -f -w ./src-tauri/dumbchat-updater.key`
> and paste the new `.pub` contents into `tauri.conf.json` → `plugins.updater.pubkey`.

### Cutting a release

1. Bump `version` in `src-tauri/tauri.conf.json`.
2. Run the release script:
   ```bash
   ./scripts/make-release.sh
   ```
   This produces, under `src-tauri/target/release/bundle/`:
   - `dmg/Dumb Chat_<version>_aarch64.dmg` — manual download
   - `macos/Dumb Chat.app.tar.gz` — the update payload
   - `latest.json` — the update manifest
3. Create a GitHub release tagged `v<version>` and upload all three. Upload the
   tarball as **`Dumb.Chat.app.tar.gz`** so it matches the URL in `latest.json`.

The updater endpoint is:
`https://github.com/trevadelman/dumb-chat/releases/latest/download/latest.json`

## Notes

- Currently builds for `aarch64` (Apple Silicon) only. For Intel/universal,
  add the target and a matching `latest.json` platform entry.
- The app is not Apple-notarized; first launch still needs the usual
  right-click → Open (the auto-updater avoids re-quarantining on subsequent
  updates).
