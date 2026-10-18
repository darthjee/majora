"""Views package for the accounts app."""

from accounts.views.api_tokens import api_token, api_token_options, api_tokens
from accounts.views.auth import (
    account,
    header_status,
    language,
    login,
    logout,
    register,
    status,
    test_email,
)
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
    'api_token',
    'api_token_options',
    'api_tokens',
    'authorization_requests_list',
    'authorize',
    'create',
    'deny',
    'header_status',
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
