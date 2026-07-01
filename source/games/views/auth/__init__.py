"""Views for authentication endpoints (login, register, logout)."""

from .email import test_email
from .language import language
from .login import login
from .logout import logout
from .register import register
from .status import status

__all__ = [
    'login',
    'register',
    'logout',
    'status',
    'language',
    'test_email',
]
