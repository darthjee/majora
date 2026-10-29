"""Shared fixtures for the staff statistics export view tests."""

from datetime import datetime, timedelta, timezone

from rest_framework.test import APIClient

from accounts.models import ApiToken
from statistics.models import Session, Visit

URL = '/staff/statistics/export.json'
RANGE = {'from': '2026-01-01', 'to': '2026-01-03'}


def at(day, hour=12, minute=0, month=1):
    """Return an aware UTC datetime in 2026."""
    return datetime(2026, month, day, hour, minute, tzinfo=timezone.utc)


def make_session(created_at, ip='203.0.113.7', **kwargs):
    """Create a statistics session and backdate its `created_at` / `last_seen_at`."""
    session = Session.objects.create(ip=ip, **kwargs)
    Session.objects.filter(pk=session.pk).update(
        created_at=created_at, last_seen_at=created_at + timedelta(hours=1),
    )
    session.refresh_from_db()
    return session


def make_visit(session, started_at, seconds=0, hits=1, **kwargs):
    """Create a visit of `session` started at `started_at`, lasting `seconds` with `hits`."""
    return Visit.objects.create(
        session=session, started_at=started_at,
        last_seen_at=started_at + timedelta(seconds=seconds), hits=hits, **kwargs,
    )


def bearer_client(user, scopes, **kwargs):
    """Return an APIClient sending a new Bearer token of `user` carrying `scopes`."""
    _, plain = ApiToken.objects.create_token(user, 'investigation', scopes, **kwargs)
    client = APIClient()
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {plain}')
    return client
