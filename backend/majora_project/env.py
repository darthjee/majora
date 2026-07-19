"""Shared environment-variable parsing helpers for all Django apps."""

import os


def env_int(key, default):
    """Return the int value of environment variable `key`, or `default` if unset/invalid."""
    try:
        return int(os.environ.get(key, default))
    except (ValueError, TypeError):
        return default
