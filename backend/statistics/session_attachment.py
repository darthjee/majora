"""Shared logic for attaching an authenticated user to a statistics `Session`."""

from statistics.models import Session


def attach_user(session, user, *, created_in_request=False, first_path=None):
    """Return a session tied to `user`: `session` itself when possible, else a rotated one.

    `session` is kept (no new row) when it has no user yet — the user is then attached in
    place, atomically (`UPDATE … WHERE user_id IS NULL`) — or when it is already tied to
    `user`. When the atomic attach matches no row (a concurrent request claimed it, or the
    row vanished), the owner is re-read from the database, never trusted from the stale
    in-memory `None`: a row now tied to `user` is reused. A session tied to a different user,
    or deleted mid-request, rotates to a brand-new `Session` row, leaving the original one
    untouched.

    `created_in_request` marks a session created during the current request: an in-place
    attach then also records `first_seen_logged = True` in the same `UPDATE`. A rotated row
    records `login_rotation`, `first_seen_logged = True` and `first_path` (the rotating
    request's route pattern).
    """
    if _claim(session, user, created_in_request):
        return session

    return _rotate(session, user, first_path)


def _claim(session, user, created_in_request):
    """Return whether `session` ends up tied to `user` without creating a new row."""
    if session.user_id is not None:
        return session.user_id == user.pk
    if _attach_in_place(session, user, created_in_request):
        return True
    return _reread_owner_is(session, user)


def _attach_in_place(session, user, created_in_request):
    """Atomically attach `user` to `session` if still unclaimed; return whether it worked.

    For a session created during this request, the same `UPDATE` marks it logged at creation.
    """
    fields = {'user': user}
    if created_in_request:
        fields['first_seen_logged'] = True

    updated = Session.objects.filter(pk=session.pk, user_id__isnull=True).update(**fields)
    if not updated:
        return False

    _assign(session, fields)
    return True


def _reread_owner_is(session, user):
    """Re-read `session`'s owner after a lost attach; adopt it and return `True` if `user`.

    A row that vanished reads as no owner, so it is never adopted.
    """
    owner_id = Session.objects.filter(pk=session.pk).values_list('user_id', flat=True).first()
    if owner_id is None or owner_id != user.pk:
        return False

    session.user = user
    return True


def _assign(session, fields):
    """Copy the written `fields` onto the in-memory `session`."""
    for name, value in fields.items():
        setattr(session, name, value)


def _rotate(session, user, first_path):
    """Create and return a new `Session` for `user`, copying `session`'s IP and domain."""
    return Session.objects.create(
        ip=session.ip, user=user, domain=session.domain, first_path=first_path,
        creation_reason=Session.CreationReason.LOGIN_ROTATION, first_seen_logged=True,
    )
