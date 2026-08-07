"""Character permissions serializer for the games app; shared by the PC and NPC endpoints."""

from games.serializers.base_permissions import BasePermissionsSerializer
from permissions import PermissionsBuilder

_PC_PAGE_KEY = 'character_pc'
_NPC_PAGE_KEY = 'character_npc'


class CharacterPermissionsSerializer(BasePermissionsSerializer):
    """Serializes every per-character permission flag for the permissions.json endpoint.

    Used as-is for both PC and NPC endpoints: `UIPermission` already resolves `owner` only
    for a PC (via `Roles.is_owner()`), so no PC-specific subclass is needed — unlike
    `PcAccessSerializer`, which does need its own `_get_is_owner` for the identity
    (`access.json`) side.
    """

    def to_representation(self, character):
        """Build the permissions response dict via the YAML-driven `PermissionsBuilder`.

        `character` may be `None` (the entity-agnostic `/permissions/game_pc.json`/
        `/permissions/game_npc.json` endpoints never look one up) — harmless for `game`/`pc`
        since `roles` is always populated from `?role=` and every permission check below only
        ever consults `roles`, but the PC/NPC page config still differs, so the view must pass
        which one via the `npc` context key (see `_page_key` below).
        """
        page_key = self._page_key(character)
        game = character.game if character is not None else None
        return PermissionsBuilder(
            page_key=page_key, user=self._user(), game=game, pc=character,
            roles=self._simulated_roles(),
        ).build()

    def _page_key(self, character):
        """Return the PC/NPC page config key, from `character.is_pc` or the context's `npc`."""
        if character is not None:
            return _PC_PAGE_KEY if character.is_pc else _NPC_PAGE_KEY
        return _NPC_PAGE_KEY if self.context.get('npc') else _PC_PAGE_KEY
