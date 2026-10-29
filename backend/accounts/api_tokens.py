"""Helpers shared by the scoped API token endpoints (see `docs/agents/access-control/api-token.md`).

"Reachable" is defined once here: the games where the user is DM, a player or a PC owner
(a PC owner is always a `Player` of the PC's game), plus every game for superusers. Plain
staff count as members only.
"""

from accounts.scopes import SCOPES, STAFF_ONLY_SCOPES
from games.caches import AdminOrStaffCache
from games.models import Game


def reaches_all_games(user):
    """Return whether `user` reaches every game (superusers only)."""
    return bool(user.is_superuser)


def reachable_games(user):
    """Return the queryset of games `user` may put on (or resolve for) a scoped token."""
    if reaches_all_games(user):
        return Game.objects.all()
    return Game.objects.filter(players__user=user).distinct()


def may_hold_staff_scopes(user):
    """Return whether `user` may be granted the staff-only scopes (admin or staff)."""
    return AdminOrStaffCache.is_admin_or_staff(user)


def grantable_scopes(user):
    """Return the catalogue scopes `user` may put on a token, in catalogue order."""
    if may_hold_staff_scopes(user):
        return SCOPES
    return tuple(scope for scope in SCOPES if scope not in STAFF_ONLY_SCOPES)
