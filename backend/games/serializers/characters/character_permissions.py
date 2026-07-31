"""Character permissions serializer for the games app; shared by the PC and NPC endpoints."""

from games.permissions import PermissionsBuilder, Roles
from games.serializers.base_permissions import BasePermissionsSerializer

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
        """Build the permissions response dict via the YAML-driven `PermissionsBuilder`."""
        if character is None:
            return PermissionsBuilder(page_key=_PC_PAGE_KEY, roles=Roles.from_booleans()).build()
        page_key = _PC_PAGE_KEY if character.is_pc else _NPC_PAGE_KEY
        return PermissionsBuilder(
            page_key=page_key, user=self._user(), game=character.game, pc=character,
            roles=self._simulated_roles(),
        ).build()
