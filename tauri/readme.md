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

The whole flow is scripted in `scripts/make-release.sh`. The only manual steps
are bumping and committing the version:

1. Bump `version` in `src-tauri/tauri.conf.json`.
2. Commit and push that bump to `main`.
3. Build **and publish** in one command:
   ```bash
   ./scripts/make-release.sh --publish
   ```
   This builds the signed bundle, generates `latest.json`, creates the
   `v<version>` git tag, and creates the GitHub release with all assets
   attached — the dmg, the `Dumb.Chat.app.tar.gz` update payload (+ `.sig`),
   and `latest.json`.
4. Verify the updater sees it (see below), then open an older install and
   confirm it offers the update on launch.

Prereqs for `--publish`: the [`gh` CLI](https://cli.github.com) installed and
authenticated (`gh auth status`). The script refuses to run if a release for
the current version already exists, so always bump first.

**Build without publishing** (e.g. to test the bundle locally) by omitting the
flag — it prints the manual upload list instead:

```bash
./scripts/make-release.sh
```

> **Why the tarball gets renamed to `Dumb.Chat.app.tar.gz`:** GitHub rewrites
> spaces in uploaded asset names to dots, which would break the URL baked into
> `latest.json`. The script renames the payload up-front so the manifest URL
> stays stable. Don't undo this.

The updater endpoint is:
`https://github.com/trevadelman/dumb-chat/releases/latest/download/latest.json`

Quick check that a release is live and well-formed:

```bash
curl -sL https://github.com/trevadelman/dumb-chat/releases/latest/download/latest.json | jq
```


## Notes

- Currently builds for `aarch64` (Apple Silicon) only. For Intel/universal,
  add the target and a matching `latest.json` platform entry.
- The app is not Apple-notarized; first launch still needs the usual
  right-click → Open (the auto-updater avoids re-quarantining on subsequent
  updates).
