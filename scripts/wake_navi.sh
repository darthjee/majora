#!/bin/bash

MAX_ATTEMPTS="${MAX_ATTEMPTS:-10}"
SLEEP_SECONDS="${SLEEP_SECONDS:-15}"
KEEPALIVE_PINGS="${KEEPALIVE_PINGS:-4}"
KEEPALIVE_SLEEP_SECONDS="${KEEPALIVE_SLEEP_SECONDS:-30}"

echo "Using MAX_ATTEMPTS=$MAX_ATTEMPTS SLEEP_SECONDS=$SLEEP_SECONDS KEEPALIVE_PINGS=$KEEPALIVE_PINGS KEEPALIVE_SLEEP_SECONDS=$KEEPALIVE_SLEEP_SECONDS"

function keep_navi_warm() {
  for PING in $(seq 1 "$KEEPALIVE_PINGS"); do
    sleep "$KEEPALIVE_SLEEP_SECONDS"

    STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$NAVI_URL")
    echo "KEEPALIVE PING $PING/$KEEPALIVE_PINGS - status $STATUS"

    if [ "$STATUS" == "502" ]; then
      echo "Navi went back to sleep during keep-alive"
      exit 1
    fi
  done

  exit 0
}

function wake_navi() {
  for ATTEMPT in $(seq 1 "$MAX_ATTEMPTS"); do
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$NAVI_URL")
    echo "ATTEMPT $ATTEMPT - status $STATUS"

    if [ "$STATUS" != "502" ]; then
      echo "Navi is awake (status $STATUS)"
      keep_navi_warm
    fi

    sleep "$SLEEP_SECONDS"
  done

  echo "Navi did not wake up after $MAX_ATTEMPTS attempts"
  exit 1
}

wake_navi
