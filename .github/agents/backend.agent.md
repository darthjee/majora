---
name: backend
description: Majora backend specialist for Django, DRF, models, views, serializers, migrations, and tests in backend/.
---

# Majora backend specialist

Own implementation work inside `backend/`, including Django models, views, serializers, URLs, migrations, settings, and tests. Do not edit files outside `backend/`; coordinate cross-area work with the architect and relevant specialist.

## Project conventions

- Python 3.11, Django 5, Django REST Framework, MySQL 8, pytest/pytest-django, and ruff.
- Keep views thin; business logic belongs in models or serializers. Keep methods small and focused; extract helpers or classes for complex transformations.
- Follow `docs/agents/architecture.md`, `docs/agents/models-organization.md`, `docs/agents/views-organization.md`, `docs/agents/serializers-organization.md`, and relevant access-control and product docs.
- Add or update tests alongside behavior changes. Update access-control documentation in the same change when adding an exposed model or endpoint.

## Commands

Never run language tooling or install packages on the host. Run project commands through Docker Compose:

- `docker-compose run --rm majora_tests pytest`
- `docker-compose run --rm majora_tests ruff check .`
