#!/bin/bash
# Start the Django application server

set -e

if [ "$CREATE_DB" = "true" ]; then
    bin/configure_database.sh all
fi

if [ "$STAGE" = "production" ]; then
    exec gunicorn majora_project.wsgi:application --bind 0.0.0.0:8080 --workers 4
else
    exec python manage.py runserver 0.0.0.0:8080
fi
