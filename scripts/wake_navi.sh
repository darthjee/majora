#!/bin/bash

MAX_ATTEMPTS=10
SLEEP_SECONDS=15

function wake_navi() {
  for ATTEMPT in $(seq 1 "$MAX_ATTEMPTS"); do
    echo "ATTEMPT $ATTEMPT"
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$NAVI_URL")

    if [ "$STATUS" != "502" ]; then
      echo "Navi is awake (status $STATUS)"
      exit 0
    fi

    sleep "$SLEEP_SECONDS"
  done

  echo "Navi did not wake up after $MAX_ATTEMPTS attempts"
  exit 1
}

wake_navi
