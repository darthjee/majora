#!/bin/bash

RESOURCE_FILES=(
  navi/resources/games.yml
  navi/resources/npcs.yml
  navi/resources/pcs.yml
  navi/resources/permissions.yml
  navi/resources/treasures.yml
  navi/resources/clients.yml
)

function push_config() {
  FILE_ARGS=()
  for f in "${RESOURCE_FILES[@]}"; do
    FILE_ARGS+=(--file "$f")
  done

  navi-client -b "$NAVI_URL" -t "$NAVI_API_TOKEN" -a config "${FILE_ARGS[@]}"
}

function start_engine() {
  navi-client -b "$NAVI_URL" -t "$NAVI_API_TOKEN" -a engine-start \
    -p "{\"targets\":[{\"namespace\":\"$NAVI_NAMEPACE\"}]}"
}

ACTION=$1

case $ACTION in
  "config")
    push_config
    ;;
  "engine-start")
    start_engine
    ;;
  *)
    $ACTION
    ;;
esac
