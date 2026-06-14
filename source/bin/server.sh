#!/bin/bash

if [ "$CREATE_DB" = "true" ]; then
  bin/configure_database.sh all
else
  bin/configure_database.sh migrate
fi

if [ "$STAGE" = "production" ]; then
  poetry run gunicorn majora_project.wsgi:application --bind 0.0.0.0:8080 --workers 4
else
  poetry run python manage.py runserver 0.0.0.0:8080
fi
