"""Shared logic for attaching an authenticated user to a statistics `Session`."""

from statistics.models import Session


def attach_user(session, user, *, always_rotate=False):
    """Return `session` with `user` attached, rotating to a new `Session` if already tied.

    If `session` has no user yet and `always_rotate` is `False`, it is updated in place
    (atomically, guarding against a concurrent attach) and returned. Otherwise — the
    session is already tied to a user (the same one or a different one), the caller
    requested `always_rotate=True`, or the atomic in-place update lost a race — a
    brand-new `Session` row is created and returned instead, leaving the original
    session untouched.
    """
    if not always_rotate and session.user_id is None and _attach_in_place(session, user):
        return session

    return Session.objects.create(ip=session.ip, user=user)


def _attach_in_place(session, user):
    """Atomically attach `user` to `session` if still unclaimed; return whether it worked."""
    updated = Session.objects.filter(pk=session.pk, user_id__isnull=True).update(user=user)
    if not updated:
        return False

    session.user = user
    return True
