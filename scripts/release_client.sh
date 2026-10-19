#!/usr/bin/env bash
#
# Publish the Majora client (client/, npm package majora-client) on an app version tag.
#
# Used by the client-release CircleCI job. Given CIRCLE_TAG (X.Y.Z), it compares the
# client version at CIRCLE_TAG with the one at the previous app tag and:
#   - exits 0 without publishing when the version is unchanged;
#   - fails when the version is already on npm, or lower than npm's latest;
#   - otherwise writes NPM_TOKEN to ~/.npmrc and runs npm publish.
#
# Recovery: re-run the job on the same tag; the decision only depends on the two tags.

set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
CLIENT_DIR="$ROOT/client"
PACKAGE_NAME="majora-client"
SEMVER_REGEX='^[0-9]+\.[0-9]+\.[0-9]+$'

function fail() {
  echo "Error: $*" >&2
  exit 1
}

# Succeeds when $1 is strictly lower than $2 in version order
function version_lt() {
  [ "$1" != "$2" ] && [ "$(printf '%s\n%s\n' "$1" "$2" | sort -V | head -n 1)" = "$1" ]
}

function check_tag() {
  if [ -z "${CIRCLE_TAG:-}" ]; then
    fail "CIRCLE_TAG is not set; client-release only runs on app version tags"
  fi

  if ! echo "$CIRCLE_TAG" | grep -qE "$SEMVER_REGEX"; then
    fail "CIRCLE_TAG '$CIRCLE_TAG' is not in X.Y.Z format"
  fi
}

# Prints the highest X.Y.Z tag strictly lower than CIRCLE_TAG (nothing if there is none)
function previous_tag() {
  local tag

  for tag in $(git tag --list --sort=-v:refname | grep -E "$SEMVER_REGEX" || true); do
    if version_lt "$tag" "$CIRCLE_TAG"; then
      echo "$tag"
      return 0
    fi
  done
}

# Reads the version field from a package.json given on stdin
function read_version() {
  node -p 'JSON.parse(require("fs").readFileSync(0, "utf8")).version'
}

function current_version() {
  read_version < "$CLIENT_DIR/package.json"
}

# Prints the client version at tag $1 (nothing if client/package.json does not exist there)
function version_at() {
  local content

  if content=$(git show "$1:client/package.json" 2>/dev/null); then
    echo "$content" | read_version
  fi
}

# Runs npm view with the given arguments and prints its output.
# A package that was never published (E404) prints nothing instead of failing.
function npm_view() {
  local output errors status=0

  errors=$(mktemp)
  output=$(npm view "$@" 2>"$errors") || status=$?

  if [ "$status" -ne 0 ]; then
    if grep -q 'E404' "$errors"; then
      output=""
    else
      cat "$errors" >&2
      rm -f "$errors"
      fail "npm view $* failed"
    fi
  fi

  rm -f "$errors"
  echo "$output"
}

function check_registry() {
  local version=$1
  local published latest

  published=$(npm_view "$PACKAGE_NAME@$version" version)
  if [ -n "$published" ]; then
    fail "$PACKAGE_NAME@$version is already published on npm"
  fi

  latest=$(npm_view "$PACKAGE_NAME" dist-tags.latest)
  if [ -n "$latest" ] && version_lt "$version" "$latest"; then
    fail "$PACKAGE_NAME@$version is lower than the latest published version ($latest)"
  fi
}

function publish() {
  if [ -z "${NPM_TOKEN:-}" ]; then
    fail "NPM_TOKEN is not set; add it to the CircleCI project environment variables"
  fi

  (umask 077 && echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" > "$HOME/.npmrc")

  cd "$CLIENT_DIR"
  npm publish --access public
}

function release() {
  local prev version prev_version

  check_tag
  git fetch --tags --force --quiet

  version=$(current_version)
  prev=$(previous_tag)

  if [ -z "$prev" ]; then
    echo "No app tag before $CIRCLE_TAG; publishing client version $version"
  else
    prev_version=$(version_at "$prev")

    if [ "$prev_version" = "$version" ]; then
      echo "client version $version unchanged since $prev; nothing to publish"
      exit 0
    fi

    echo "client version changed since $prev (${prev_version:-none} -> $version); publishing"
  fi

  check_registry "$version"
  publish
}

release
