"""Serializers package for the accounts app."""

from accounts.serializers.auth.my_account_detail import MyAccountDetailSerializer
from accounts.serializers.auth.my_account_update import MyAccountUpdateSerializer

__all__ = [
    'MyAccountDetailSerializer',
    'MyAccountUpdateSerializer',
]
