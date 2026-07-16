"""Shared logic for attaching an authenticated user to a statistics `Session`."""

from statistics.models import Session


def attach_user(session, user):
    """Return `session` with `user` attached, rotating to a new `Session` if already tied.

    If `session` has no user yet, it is updated in place and returned. If it is already
    tied to a user (the same one or a different one), a brand-new `Session` row is created
    and returned instead, leaving the original session untouched.
    """
    if session.user_id is None:
        session.user = user
        session.save(update_fields=['user'])
        return session

    return Session.objects.create(ip=session.ip, user=user)
