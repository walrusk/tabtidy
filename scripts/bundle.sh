#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
DIST_DIR="$REPO_ROOT/dist"

if ! command -v zip >/dev/null 2>&1; then
  echo "Error: 'zip' command not found."
  exit 1
fi

cd "$REPO_ROOT"

echo "Building TabTidy extension..."
npm run build

if [[ ! -f "$DIST_DIR/manifest.json" ]]; then
  echo "Error: dist/manifest.json not found after build."
  exit 1
fi

PACKAGE_NAME="$(node -p "require('./package.json').name")"
VERSION="$(node -p "require('./package.json').version")"
ZIP_NAME="${PACKAGE_NAME}-v${VERSION}.zip"
ZIP_PATH="$REPO_ROOT/$ZIP_NAME"

echo "Creating archive: $ZIP_NAME"
rm -f "$ZIP_PATH"

(
  cd "$DIST_DIR"
  zip -r "$ZIP_PATH" . -x "*.DS_Store"
)

echo "Done: $ZIP_PATH"
