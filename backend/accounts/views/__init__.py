"""Views package for the accounts app."""

from accounts.views.auth import account, language, login, logout, register, status, test_email
from accounts.views.authorization_requests import (
    authorization_requests_list,
    authorize,
    create,
    deny,
    poll,
)
from accounts.views.password_reset import recover, reset_password

__all__ = [
    'account',
    'authorization_requests_list',
    'authorize',
    'create',
    'deny',
    'language',
    'login',
    'logout',
    'poll',
    'recover',
    'register',
    'reset_password',
    'status',
    'test_email',
]
