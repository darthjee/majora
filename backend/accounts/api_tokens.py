"""Helpers shared by the scoped API token endpoints (see `docs/agents/access-control/api-token.md`).

"Reachable" is defined once here: the games where the user is DM, a player or a PC owner
(a PC owner is always a `Player` of the PC's game), plus every game for superusers. Plain
staff count as members only.
"""

from games.models import Game


def reaches_all_games(user):
    """Return whether `user` reaches every game (superusers only)."""
    return bool(user.is_superuser)


def reachable_games(user):
    """Return the queryset of games `user` may put on (or resolve for) a scoped token."""
    if reaches_all_games(user):
        return Game.objects.all()
    return Game.objects.filter(players__user=user).distinct()
