#!/usr/bin/env bash
#
# Builds a signed Dumb Chat release and generates the latest.json manifest
# that the Tauri updater reads from GitHub releases.
#
# Usage:
#   ./scripts/make-release.sh
#
# Prereqs:
#   - The updater private key at src-tauri/dumbchat-updater.key (gitignored)
#   - Bump "version" in src-tauri/tauri.conf.json before running
#
# Upload to the GitHub release for the matching tag:
#   - Dumb Chat_<version>_aarch64.dmg        (what users download manually)
#   - Dumb Chat.app.tar.gz                    (the update payload)
#   - latest.json                             (the update manifest)

set -euo pipefail

cd "$(dirname "$0")/.."

KEY_PATH="$(pwd)/src-tauri/dumbchat-updater.key"
if [[ ! -f "$KEY_PATH" ]]; then
  echo "ERROR: signing key not found at $KEY_PATH" >&2
  exit 1
fi

VERSION="$(node -p "require('./src-tauri/tauri.conf.json').version")"
REPO="trevadelman/dumb-chat"
BUNDLE="src-tauri/target/release/bundle"

echo "Building signed release v$VERSION ..."
TAURI_SIGNING_PRIVATE_KEY="$(cat "$KEY_PATH")" \
TAURI_SIGNING_PRIVATE_KEY_PASSWORD="" \
  npm run tauri build

SIG="$(cat "$BUNDLE/macos/Dumb Chat.app.tar.gz.sig")"
PUB_DATE="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

cat > "$BUNDLE/latest.json" <<JSON
{
  "version": "$VERSION",
  "notes": "See the release notes on GitHub.",
  "pub_date": "$PUB_DATE",
  "platforms": {
    "darwin-aarch64": {
      "signature": "$SIG",
      "url": "https://github.com/$REPO/releases/download/v$VERSION/Dumb.Chat.app.tar.gz"
    }
  }
}
JSON

echo ""
echo "Done. Upload these to the GitHub release tagged v$VERSION:"
echo "  $BUNDLE/dmg/Dumb Chat_${VERSION}_aarch64.dmg"
echo "  $BUNDLE/macos/Dumb Chat.app.tar.gz   (rename upload to: Dumb.Chat.app.tar.gz)"
echo "  $BUNDLE/latest.json"
