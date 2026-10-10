#!/bin/bash

export LOG_LEVEL=debug

NAVI_DIR="${NAVI_DIR:-navi}"
NAVI_CONFIG_FILE="${NAVI_CONFIG_FILE:-$NAVI_DIR/navi_config.yaml}"

function load_resource_files() {
  if [ ! -f "$NAVI_CONFIG_FILE" ]; then
    echo "ERROR: Navi config file not found: $NAVI_CONFIG_FILE" >&2
    exit 1
  fi

  RESOURCE_FILES=()
  local entry
  while IFS= read -r entry; do
    [ -n "$entry" ] && RESOURCE_FILES+=("$NAVI_DIR/$entry")
  done < <(
    awk '
      { sub(/\r$/, "") }
      /^include:[[:space:]]*(#.*)?$/ { in_include = 1; next }
      in_include && /^[^[:space:]#]/ { in_include = 0 }
      in_include && /^[[:space:]]+-[[:space:]]+/ {
        line = $0
        sub(/^[[:space:]]+-[[:space:]]+/, "", line)
        sub(/[[:space:]]+#.*$/, "", line)
        sub(/[[:space:]]+$/, "", line)
        gsub(/^["'\'']|["'\'']$/, "", line)
        print line
      }
    ' "$NAVI_CONFIG_FILE"
  )

  if [ ${#RESOURCE_FILES[@]} -eq 0 ]; then
    echo "ERROR: no resource files found under 'include:' in $NAVI_CONFIG_FILE" >&2
    exit 1
  fi

  local missing=0
  local f
  for f in "${RESOURCE_FILES[@]}"; do
    if [ ! -f "$f" ]; then
      echo "ERROR: resource file listed in $NAVI_CONFIG_FILE not found: $f" >&2
      missing=1
    fi
  done
  if [ $missing -ne 0 ]; then
    exit 1
  fi
}

function push_config() {
  FILE_ARGS=()
  for f in "${RESOURCE_FILES[@]}"; do
    FILE_ARGS+=(--file "$f")
  done

  navi-client -b "$NAVI_URL" -t "$NAVI_API_TOKEN" -a config "${FILE_ARGS[@]}"
}

function push_all_configs() {
  IFS=',' read -ra URLS <<< "$MAJORA_PRODUCTION_URLS"
  for i in "${!URLS[@]}"; do
    export NAVI_NAMEPACE="${NAVI_NAMEPACE_BASE}-$((i + 1))"
    export MAJORA_PRODUCTION_URL="${URLS[$i]}"
    push_config
  done
}

function start_engine() {
  IFS=',' read -ra URLS <<< "$MAJORA_PRODUCTION_URLS"
  TARGETS=()
  for i in "${!URLS[@]}"; do
    TARGETS+=("{\"namespace\":\"${NAVI_NAMEPACE_BASE}-$((i + 1))\"}")
  done
  TARGETS_JSON=$(IFS=,; echo "${TARGETS[*]}")

  navi-client -b "$NAVI_URL" -t "$NAVI_API_TOKEN" -a engine-start \
    -p "{\"targets\":[$TARGETS_JSON]}"
}

ACTION=$1

case $ACTION in
  "config")
    load_resource_files
    push_all_configs
    ;;
  "engine-start")
    start_engine
    ;;
  *)
    $ACTION
    ;;
esac
