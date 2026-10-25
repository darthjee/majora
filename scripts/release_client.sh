#!/usr/bin/env bash
#
# Publish the Majora client (client/, npm package majora-client) on an app version tag.
#
# Used by the client-release CircleCI job. Given CIRCLE_TAG (X.Y.Z), it compares the
# client version at CIRCLE_TAG with the one at the previous app tag and:
#   - exits 0 without publishing when the version is unchanged;
#   - exits 0 without publishing when the version is already on npm (safe re-runs);
#   - fails when the version is lower than npm's latest;
#   - otherwise publishes through npm trusted publishing (CircleCI OIDC): it mints a
#     short-lived OIDC token with the npm audience, exports it as NPM_ID_TOKEN and runs
#     npm publish, which exchanges it for a one-off publish credential. No npm token is
#     used anywhere (NPM_TOKEN / NODE_AUTH_TOKEN must not be set).
#
# Before publishing it checks the trusted-publishing floors (Node >= 22.14.0, npm >= 11.5.1)
# and that the circleci CLI is available. After a successful publish it waits for the
# version to show up on the registry, but only warns on timeout (the publish can't be undone).
#
# Recovery: re-run the job on the same tag; the decision only depends on the two tags and
# an already-published version is a no-op.

set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
CLIENT_DIR="$ROOT/client"
PACKAGE_NAME="majora-client"
SEMVER_REGEX='^[0-9]+\.[0-9]+\.[0-9]+$'
MIN_NODE_VERSION="22.14.0"
MIN_NPM_VERSION="11.5.1"
VERIFY_TIMEOUT=300
VERIFY_INTERVAL=5

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

# Publishing is OIDC-only: refuses stray npm tokens and checks the trusted-publishing
# floors (Node/npm versions and the circleci CLI that mints the OIDC token).
function preflight() {
  local node_version npm_version

  if [ -n "${NPM_TOKEN:-}" ] || [ -n "${NODE_AUTH_TOKEN:-}" ]; then
    fail "NPM_TOKEN or NODE_AUTH_TOKEN is set; publishing is OIDC-only, unset it"
  fi

  node_version=$(node --version)
  node_version=${node_version#v}
  if version_lt "$node_version" "$MIN_NODE_VERSION"; then
    fail "Node $node_version is too old for npm trusted publishing (need >= $MIN_NODE_VERSION)"
  fi

  npm_version=$(npm --version)
  if version_lt "$npm_version" "$MIN_NPM_VERSION"; then
    fail "npm $npm_version is too old for npm trusted publishing (need >= $MIN_NPM_VERSION)"
  fi

  if ! command -v circleci >/dev/null 2>&1; then
    fail "the circleci CLI is not on PATH; it is needed to mint the OIDC token"
  fi
}

function check_registry() {
  local version=$1
  local published latest

  published=$(npm_view "$PACKAGE_NAME@$version" version)
  if [ -n "$published" ]; then
    echo "$PACKAGE_NAME@$version is already published; nothing to do"
    exit 0
  fi

  latest=$(npm_view "$PACKAGE_NAME" dist-tags.latest)
  if [ -n "$latest" ] && version_lt "$version" "$latest"; then
    fail "$PACKAGE_NAME@$version is lower than the latest published version ($latest)"
  fi
}

function publish() {
  cd "$CLIENT_DIR"

  # npm only uses an OIDC token passed as NPM_ID_TOKEN, with the npm audience
  # (CircleCI's default CIRCLE_OIDC_TOKEN_V2 has the org ID as its audience).
  NPM_ID_TOKEN="$(circleci run oidc get --claims '{"aud": "npm:registry.npmjs.org"}')"
  export NPM_ID_TOKEN
  npm publish
}

# Waits for the published version to be visible on the registry. Never fails the job:
# once npm publish succeeded nothing can be undone, so registry lag only warns.
function verify() {
  local version=$1
  local elapsed=0 published integrity

  while [ "$elapsed" -lt "$VERIFY_TIMEOUT" ]; do
    published=$(npm view "$PACKAGE_NAME@$version" version 2>/dev/null || true)

    if [ "$published" = "$version" ]; then
      integrity=$(npm view "$PACKAGE_NAME@$version" dist.integrity 2>/dev/null || true)
      echo "$PACKAGE_NAME@$version is visible on npm (integrity: ${integrity:-unknown})"
      exit 0
    fi

    sleep "$VERIFY_INTERVAL"
    elapsed=$((elapsed + VERIFY_INTERVAL))
  done

  echo "Warning: $PACKAGE_NAME@$version was published but is not visible after ${VERIFY_TIMEOUT}s (registry lag); check it later with: npm view $PACKAGE_NAME@$version version" >&2
  exit 0
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

  preflight
  check_registry "$version"
  publish
  verify "$version"
}

release
