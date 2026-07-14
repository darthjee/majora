#!/bin/bash

wait_for_db() {
  MAX_RETRIES=${MAX_RETRIES:-30}
  RETRY_INTERVAL=${RETRY_INTERVAL:-2}

  echo "Waiting for database in $MAJORA_MYSQL_HOST:$MAJORA_MYSQL_PORT ..."

  for ((i=1; i<=MAX_RETRIES; i++)); do
    if mysqladmin ping -h"$MAJORA_MYSQL_HOST" -u"$MAJORA_MYSQL_USER" -p"$MAJORA_MYSQL_PASSWORD" --silent; then
      return 0
    fi

    sleep "$RETRY_INTERVAL"
  done

  echo "Database inaccessible after $MAX_RETRIES attempts."
  return 1
}

migrate() {
  echo "Running migrations..."
  poetry run python manage.py migrate
}

all() {
  wait_for_db
  migrate
}

case "$1" in
  wait)
    wait_for_db
    ;;
  migrate)
    migrate
    ;;
  all)
    all
    ;;
  *)
    echo "Usage: $0 {wait|migrate|all}"
    ;;
esac
