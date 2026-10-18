"""Accounts app configuration."""

from django.apps import AppConfig


class AccountsConfig(AppConfig):
    """Configuration for the accounts app."""

    default_auto_field = 'django.db.models.BigAutoField'
    name = 'accounts'

    def ready(self):
        """Revoke game-restricted API tokens whose every allowed game gets deleted."""
        from games.models import Game

        from .signals import connect_game_token_revocation

        connect_game_token_revocation(Game)
