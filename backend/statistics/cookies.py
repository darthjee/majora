"""Signing helpers for the statistics session cookie."""

from django.core.signing import BadSignature, Signer

COOKIE_NAME = 'majora_statistics'


def _signer():
    """Return the `Signer` used for the statistics session cookie."""
    return Signer(salt='statistics.session')


def sign(token: str) -> str:
    """Return `token` signed for safe storage in the statistics session cookie."""
    return _signer().sign(token)


def unsign(value: str) -> str | None:
    """Return the token carried by `value`, or `None` if it is missing/tampered."""
    try:
        return _signer().unsign(value)
    except BadSignature:
        return None
