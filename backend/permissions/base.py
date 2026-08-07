"""Shared role-shortcut/config-entry logic for the UI and endpoint permission classes."""

from games.roles import Roles

EVERYONE_ROLE = 'everyone'


class BasePermission:
    """Resolve roles for a user/game/pc and check them against a YAML config entry.

    Constructed the same way as `Roles` (`user`, `game`, `pc`), plus an injectable `roles`
    object (easing tests, and the hook `UIPermission` uses for the `?role=` simulated-preview
    path). Subclassed by `UIPermission` and `EndpointPermission`.
    """

    def __init__(self, user=None, game=None, pc=None, roles=None):
        """Store the request context and resolve (or accept an injected) `Roles` object."""
        self._user = user
        self._game = game
        self._pc = pc
        self._roles = roles if roles is not None else Roles(user=user, game=game, pc=pc)

    def _allowed(self, entry):
        """Return whether the resolved roles satisfy `entry` (a YAML list or dict), or the shortcut.

        The shortcut (admin, or dm of the given game) always allows, unless `entry` opts out
        via `no_shortcut: true` — see `session_message`/`poll_vote`'s
        deliberate exceptions in the migration plan.
        """
        allowed_roles, no_shortcut = self._parse_entry(entry)
        if not no_shortcut and self._shortcut_allows():
            return True
        if EVERYONE_ROLE in allowed_roles:
            return True
        return any(self._role_applies(role_name) for role_name in allowed_roles)

    def _shortcut_allows(self):
        """Return whether the universal admin/dm shortcut grants access."""
        return self._roles.is_admin() or self._roles.is_dm()

    def _role_applies(self, role_name):
        """Return whether the resolved roles include `role_name`."""
        return getattr(self._roles, f'is_{role_name}')()

    @staticmethod
    def _parse_entry(entry):
        """Return an `(allowed_roles, no_shortcut)` pair, normalizing the YAML entry shape.

        `entry` is either a plain list of role names, a `{roles, no_shortcut}` dict, or
        `None`/missing (treated as no extra roles allowed).
        """
        if entry is None:
            return [], False
        if isinstance(entry, dict):
            return list(entry.get('roles', [])), bool(entry.get('no_shortcut', False))
        return list(entry), False
