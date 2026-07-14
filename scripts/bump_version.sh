#!/usr/bin/env bash

set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
README="$ROOT/README.md"
PACKAGE="$ROOT/frontend/package.json"
PYPROJECT="$ROOT/backend/pyproject.toml"

# Extract current Next Release version from README
current_next=$(grep -oE '\*\*Next Release:\*\* \[[0-9]+\.[0-9]+\.[0-9]+' "$README" | grep -oE '[0-9]+\.[0-9]+\.[0-9]+')

if [ $# -ge 1 ]; then
  new_version="$1"
else
  new_version="$current_next"
fi

# Validate semver format
if ! echo "$new_version" | grep -qE '^[0-9]+\.[0-9]+\.[0-9]+$'; then
  echo "Error: version must be in X.Y.Z format" >&2
  exit 1
fi

# Compute next release (increment patch)
IFS='.' read -r major minor patch <<< "$new_version"
next_release="${major}.${minor}.$((patch + 1))"

echo "New version:  $new_version"
echo "Next release: $next_release"

# Update README Current Version line
sed -i '' \
  "s|\*\*Current Version:\*\* \[[0-9.]*\](https://github.com/darthjee/majora/releases/tag/[0-9.]*)|\*\*Current Version:\*\* [${new_version}](https://github.com/darthjee/majora/releases/tag/${new_version})|" \
  "$README"

# Update README Next Release line
sed -i '' \
  "s|\*\*Next Release:\*\* \[[0-9.]*\](https://github.com/darthjee/majora/compare/[0-9.]*\.\.\.main)|\*\*Next Release:\*\* [${next_release}](https://github.com/darthjee/majora/compare/${new_version}...main)|" \
  "$README"

# Update frontend/package.json version
sed -i '' \
  "s|\"version\": \"[0-9.]*\"|\"version\": \"${new_version}\"|" \
  "$PACKAGE"

# Update backend/pyproject.toml version
sed -i '' \
  "s|^version = \"[0-9.]*\"|version = \"${new_version}\"|" \
  "$PYPROJECT"

echo "Done."
