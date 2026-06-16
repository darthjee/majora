# Plan: Split Django Views

Issue: [33_split_django_views.md](../issues/33_split_django_views.md)

## Branch

`issue-33-split-django-views`

## Overview

Replace the monolithic `source/games/views.py` with a `source/games/views/` package. Views will be grouped into `games.py` (list and detail) and `characters.py` (pcs, npcs, character detail). The `__init__.py` will re-export all view functions so that `urls.py` continues to work without any changes.

## Agents involved

- [Backend](backend.md)
