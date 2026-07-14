"""Views for the password recovery flow (recover, reset-password)."""

from .recover import recover
from .reset_password import reset_password

__all__ = [
    'recover',
    'reset_password',
]
