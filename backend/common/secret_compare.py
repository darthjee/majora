"""Constant-time comparison of a request header against a configured shared secret."""

import secrets


def secret_matches(header, secret):
    """Return whether `header` equals the non-empty `secret`, never raising on odd input.

    WSGI decodes header values as latin-1, so a header may hold non-ASCII characters, which
    make `secrets.compare_digest` raise `TypeError` on `str` arguments. Both sides are
    compared as bytes instead: a header that cannot match simply returns `False`.
    """
    if not secret or not header:
        return False
    return secrets.compare_digest(_header_bytes(header), secret.encode('utf-8'))


def _header_bytes(header):
    """Return the raw bytes of a WSGI (latin-1 decoded) header value."""
    return header.encode('latin-1', 'replace')
