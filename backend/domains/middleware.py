"""Custom middleware for the domains app."""

from django.conf import settings
from django.db.utils import OperationalError, ProgrammingError

from domains.models import Domain


class DomainCsrfOriginsMiddleware:
    """Extend `CSRF_TRUSTED_ORIGINS` with origins derived from `Domain` rows.

    Runs once per server process, at `__init__` time — after `bin/server.sh` has
    already run migrations to completion, so the DB is guaranteed reachable and
    migrated by the time this runs. A transient DB hiccup at worker startup is
    swallowed so it doesn't crash the process; that worker simply falls back to
    the env-var-only origins.
    """

    def __init__(self, get_response):
        self.get_response = get_response
        try:
            origins = [origin for domain in Domain.objects.all() for origin in domain.origins]
            settings.CSRF_TRUSTED_ORIGINS = list(settings.CSRF_TRUSTED_ORIGINS) + origins
        except (OperationalError, ProgrammingError):
            pass

    def __call__(self, request):
        return self.get_response(request)
