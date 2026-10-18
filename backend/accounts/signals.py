"""Signal receivers of the accounts app.

A game-restricted `ApiToken` keeps its restriction only as `ApiToken.games` M2M rows, and an
empty game list means "every game". Hard-deleting a game cascades those rows away, so a token
whose every allowed game is deleted would silently become unrestricted. To keep the token from
widening its access, `remember_game_tokens` (`pre_delete` on `Game`) records the tokens bound
to the game and `revoke_emptied_tokens` (`post_delete`, sent once the whole delete has run)
revokes -- deletes, as for any revoked token -- those left without games. Recording before and
checking after also covers a queryset delete removing several of a token's games at once.
"""

from django.db.models.signals import post_delete, pre_delete

from .models import ApiToken

TOKEN_IDS_ATTRIBUTE = '_api_token_ids'


def remember_game_tokens(sender, instance, **kwargs):
    """Record on the game being deleted the ids of the tokens restricted to it."""
    setattr(instance, TOKEN_IDS_ATTRIBUTE, list(instance.api_tokens.values_list('pk', flat=True)))


def revoke_emptied_tokens(sender, instance, **kwargs):
    """Revoke the recorded tokens that no longer have any allowed game."""
    token_ids = getattr(instance, TOKEN_IDS_ATTRIBUTE, [])
    if token_ids:
        ApiToken.objects.filter(pk__in=token_ids, games__isnull=True).delete()


def connect_game_token_revocation(game_model):
    """Connect the token revocation receivers to deletions of `game_model`."""
    pre_delete.connect(
        remember_game_tokens, sender=game_model, dispatch_uid='accounts.remember_game_tokens'
    )
    post_delete.connect(
        revoke_emptied_tokens, sender=game_model, dispatch_uid='accounts.revoke_emptied_tokens'
    )
