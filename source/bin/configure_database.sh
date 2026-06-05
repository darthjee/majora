#!/bin/bash
# Configure and initialize the database

set -e

case "$1" in
    all)
        python manage.py migrate
        ;;
    migrate)
        python manage.py migrate
        ;;
    *)
        echo "Usage: $0 {all|migrate}"
        exit 1
        ;;
esac
