#!/bin/bash

RESOURCE_FILES=(
  navi/resources/games.yml
  navi/resources/npcs.yml
  navi/resources/pcs.yml
  navi/resources/permissions.yml
  navi/resources/treasures.yml
  navi/resources/items.yml
  navi/resources/factions.yml
  navi/resources/possessions.yml
  navi/resources/documents.yml
  navi/resources/sessions.yml
  navi/resources/clients.yml
  navi/resources/domains.yml
)

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
    push_all_configs
    ;;
  "engine-start")
    start_engine
    ;;
  *)
    $ACTION
    ;;
esac
