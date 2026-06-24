#!/usr/bin/env bash
#
# Builds a signed Dumb Chat release and (optionally) publishes it to GitHub so
# the Tauri auto-updater can pick it up.
#
# What it does:
#   1. Reads the version from src-tauri/tauri.conf.json
#   2. Builds a signed bundle (.dmg + .app.tar.gz + .sig)
#   3. Generates the latest.json manifest the updater reads
#   4. Normalizes the updater payload name to Dumb.Chat.app.tar.gz so it matches
#      the URL baked into latest.json (GitHub rewrites spaces to dots on upload,
#      so we rename up-front to keep the URL stable)
#   5. With --publish: creates the git tag and the GitHub release, uploading all
#      assets in one shot via the gh CLI
#
# Usage:
#   ./scripts/make-release.sh            # build only; prints manual upload list
#   ./scripts/make-release.sh --publish  # build + tag + create GitHub release
#
# Prereqs:
#   - The updater private key at src-tauri/dumbchat-updater.key (gitignored)
#   - The version in src-tauri/tauri.conf.json already bumped + committed
#   - For --publish: the `gh` CLI installed and authenticated (gh auth status)
#
# Release checklist (the human part):
#   1. Bump "version" in src-tauri/tauri.conf.json
#   2. Commit and push that bump to main
#   3. Run ./scripts/make-release.sh --publish
#   4. Verify the new version appears at the updater endpoint and that an older
#      install offers the update on next launch

set -euo pipefail

cd "$(dirname "$0")/.."

PUBLISH=false
if [[ "${1:-}" == "--publish" ]]; then
  PUBLISH=true
fi

REPO="trevadelman/dumb-chat"
BUNDLE="src-tauri/target/release/bundle"
KEY_PATH="$(pwd)/src-tauri/dumbchat-updater.key"

# --- Preflight ---------------------------------------------------------------

if [[ ! -f "$KEY_PATH" ]]; then
  echo "ERROR: signing key not found at $KEY_PATH" >&2
  exit 1
fi

VERSION="$(node -p "require('./src-tauri/tauri.conf.json').version")"
TAG="v$VERSION"

if [[ "$PUBLISH" == true ]]; then
  if ! command -v gh >/dev/null 2>&1; then
    echo "ERROR: --publish requires the GitHub CLI (gh). Install it or run without --publish." >&2
    exit 1
  fi
  if ! gh auth status >/dev/null 2>&1; then
    echo "ERROR: gh is not authenticated. Run 'gh auth login' first." >&2
    exit 1
  fi
  if gh release view "$TAG" >/dev/null 2>&1; then
    echo "ERROR: a GitHub release for $TAG already exists. Bump the version first." >&2
    exit 1
  fi
fi

# --- Build -------------------------------------------------------------------

echo "Building signed release $TAG ..."
TAURI_SIGNING_PRIVATE_KEY="$(cat "$KEY_PATH")" \
TAURI_SIGNING_PRIVATE_KEY_PASSWORD="" \
  npm run tauri build

# --- Manifest ----------------------------------------------------------------

# Stable, URL-safe name for the updater payload (and its detached signature).
SAFE_TARBALL="Dumb.Chat.app.tar.gz"
cp "$BUNDLE/macos/Dumb Chat.app.tar.gz" "$BUNDLE/macos/$SAFE_TARBALL"
cp "$BUNDLE/macos/Dumb Chat.app.tar.gz.sig" "$BUNDLE/macos/$SAFE_TARBALL.sig"

SIG="$(cat "$BUNDLE/macos/$SAFE_TARBALL.sig")"
PUB_DATE="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

cat > "$BUNDLE/latest.json" <<JSON
{
  "version": "$VERSION",
  "notes": "See the release notes on GitHub.",
  "pub_date": "$PUB_DATE",
  "platforms": {
    "darwin-aarch64": {
      "signature": "$SIG",
      "url": "https://github.com/$REPO/releases/download/$TAG/$SAFE_TARBALL"
    }
  }
}
JSON

DMG="$BUNDLE/dmg/Dumb Chat_${VERSION}_aarch64.dmg"

# --- Publish (optional) ------------------------------------------------------

if [[ "$PUBLISH" == false ]]; then
  echo ""
  echo "Build complete. To publish manually, create a release tagged $TAG and upload:"
  echo "  $DMG"
  echo "  $BUNDLE/macos/$SAFE_TARBALL"
  echo "  $BUNDLE/macos/$SAFE_TARBALL.sig"
  echo "  $BUNDLE/latest.json"
  echo ""
  echo "Or re-run with --publish to do all of that automatically."
  exit 0
fi

echo "Tagging $TAG ..."
if git rev-parse "$TAG" >/dev/null 2>&1; then
  echo "  tag $TAG already exists locally; reusing it."
else
  git tag "$TAG"
fi
git push origin "$TAG"

echo "Creating GitHub release $TAG ..."
gh release create "$TAG" \
  --title "$TAG" \
  --notes "See the changelog for details." \
  "$DMG" \
  "$BUNDLE/macos/$SAFE_TARBALL" \
  "$BUNDLE/macos/$SAFE_TARBALL.sig" \
  "$BUNDLE/latest.json"

echo ""
echo "Published $TAG. Verify the updater picks it up:"
echo "  https://github.com/$REPO/releases/latest/download/latest.json"
