"""Role resolution for a user, scoped to an optional game and PC character."""

import sys

from majora_project.cache import memory_cache

_OWNER_ENTRY_TYPE = 'character_owner'


class Roles:
    """Resolve which roles apply to a user, given an optional game and PC character.

    Truth table (see the issue's Solution/"Roles class" section):
    - no `user`: no role applies.
    - `user` but no `game`: only `admin`/`staff`/`logged_user` can apply.
    - `user` and `game` but no `pc`: adds `dm`/`player`.
    - `user`, `game`, and `pc`: adds `owner` (only meaningful when `pc.is_pc`).
    """

    ROLE_NAMES = ('admin', 'logged_user', 'staff', 'dm', 'player', 'owner')

    def __init__(self, user=None, game=None, pc=None):
        """Store the (authenticated) `user`, optional `game`, and optional PC `character`."""
        self._user = user if (user and user.is_authenticated) else None
        self._game = game
        self._pc = pc
        self._booleans = None

    @classmethod
    def from_booleans(cls, is_superuser=False, is_dm=False, is_owner=False, is_staff=False,
                       is_player=False, is_logged=False):
        """Build a `Roles` directly from role booleans, bypassing DB resolution.

        This is the hook `UIPermission` uses to power the `?role=` simulated-preview path.
        """
        roles = cls()
        roles._booleans = {
            'admin': is_superuser,
            'logged_user': is_logged,
            'staff': is_staff,
            'dm': is_dm,
            'player': is_player,
            'owner': is_owner,
        }
        return roles

    def all_roles(self):
        """Return the list of role names that currently apply."""
        return [name for name in self.ROLE_NAMES if self._has(name)]

    def is_admin(self):
        """Return whether the user is a superuser."""
        return self._has('admin')

    def is_logged_user(self):
        """Return whether the user is logged in."""
        return self._has('logged_user')

    def is_staff(self):
        """Return whether the user is staff."""
        return self._has('staff')

    def is_dm(self):
        """Return whether the user is a DM of the game."""
        return self._has('dm')

    def is_player(self):
        """Return whether the user is a player (DM or not) of the game."""
        return self._has('player')

    def is_owner(self):
        """Return whether the user is the owning player of the PC character."""
        return self._has('owner')

    def _has(self, role_name):
        """Return whether `role_name` applies, from the simulated booleans or by resolving it."""
        if self._booleans is not None:
            return self._booleans[role_name]
        return getattr(self, f'_resolve_{role_name}')()

    def _resolve_admin(self):
        """Return whether the real user is a superuser."""
        return self._user is not None and self._user.is_superuser

    def _resolve_logged_user(self):
        """Return whether a real, authenticated user is present."""
        return self._user is not None

    def _resolve_staff(self):
        """Return whether the real user is staff."""
        return self._user is not None and self._user.is_staff

    def _resolve_dm(self):
        """Return whether the real user is a DM of `game`."""
        if self._user is None or self._game is None:
            return False
        return self._game.has_player(self._user, is_dm=True)

    def _resolve_player(self):
        """Return whether the real user is a player (DM or not) of `game`."""
        if self._user is None or self._game is None:
            return False
        return self._game.has_player(self._user)

    def _resolve_owner(self):
        """Return whether the real user is the owning player of `pc`, only for an actual PC."""
        if self._user is None or self._pc is None or not self._pc.is_pc:
            return False
        key = (self._user.id, self._pc.id)
        cached = memory_cache.get(_OWNER_ENTRY_TYPE, key)
        if cached is not None:
            return cached
        result = self._query_owner()
        memory_cache.set(_OWNER_ENTRY_TYPE, key, result, sys.getsizeof(result))
        return result

    def _query_owner(self):
        """Run the underlying query backing owner resolution: `pc.player.user_id == user.id`."""
        player = self._pc.player
        return player is not None and player.user_id == self._user.id
