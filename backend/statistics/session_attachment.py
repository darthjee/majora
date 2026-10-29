"""Shared logic for attaching an authenticated user to a statistics `Session`."""

from statistics.models import Session


def attach_user(session, user, *, always_rotate=False, created_in_request=False, first_path=None):
    """Return `session` with `user` attached, rotating to a new `Session` if already tied.

    If `session` has no user yet and `always_rotate` is `False`, it is updated in place
    (atomically, guarding against a concurrent attach) and returned. Otherwise — the
    session is already tied to a user (the same one or a different one), the caller
    requested `always_rotate=True`, or the atomic in-place update lost a race — a
    brand-new `Session` row is created and returned instead, leaving the original
    session untouched.

    `created_in_request` marks a session created during the current request: an in-place
    attach then also records `first_seen_logged = True` in the same `UPDATE`. A rotated row
    records `login_rotation`, `first_seen_logged = True` and `first_path` (the rotating
    request's route pattern).
    """
    in_place = not always_rotate and session.user_id is None
    if in_place and _attach_in_place(session, user, created_in_request):
        return session

    return _rotate(session, user, first_path)


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

    for name, value in fields.items():
        setattr(session, name, value)
    return True


def _rotate(session, user, first_path):
    """Create and return a new `Session` for `user`, copying `session`'s IP and domain."""
    return Session.objects.create(
        ip=session.ip, user=user, domain=session.domain, first_path=first_path,
        creation_reason=Session.CreationReason.LOGIN_ROTATION, first_seen_logged=True,
    )
