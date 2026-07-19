"""Views package for the accounts app."""

from accounts.views.auth import account, language, login, logout, register, status, test_email
from accounts.views.password_reset import recover, reset_password

__all__ = [
    'account',
    'language',
    'login',
    'logout',
    'recover',
    'register',
    'reset_password',
    'status',
    'test_email',
]
