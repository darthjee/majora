"""Resolve the real client IP, trusting `X-Forwarded-For` only from the Tent proxy."""

import ipaddress
import os
import secrets


def proxy_secret():
    """Return the configured proxy shared secret, or '' if unset (trust disabled)."""
    return os.environ.get('PROXY_SECRET', '')


def client_ip(request):
    """Return the client IP: the leftmost trusted `X-Forwarded-For` entry, else `REMOTE_ADDR`."""
    forwarded = _forwarded_ip(request) if _from_trusted_proxy(request) else None
    return forwarded or request.META.get('REMOTE_ADDR')


def _from_trusted_proxy(request):
    """Return whether the request carries a `X-Proxy-Secret` matching `PROXY_SECRET`."""
    secret = proxy_secret()
    header = request.META.get('HTTP_X_PROXY_SECRET')
    if not secret or not header:
        return False
    return secrets.compare_digest(header, secret)


def _forwarded_ip(request):
    """Return the leftmost `X-Forwarded-For` entry if it is a valid IP, else `None`."""
    header = request.META.get('HTTP_X_FORWARDED_FOR') or ''
    candidate = header.split(',')[0].strip()
    return candidate if _valid_ip(candidate) else None


def _valid_ip(value):
    """Return whether `value` parses as an IPv4 or IPv6 address."""
    try:
        ipaddress.ip_address(value)
    except ValueError:
        return False
    return True
