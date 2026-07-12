"""Character permissions serializer for the games app; shared by the PC and NPC endpoints."""

from games.serializers.base_permissions import BasePermissionsSerializer


class CharacterPermissionsSerializer(BasePermissionsSerializer):
    """Serializes the can_edit permission for a character (PC or NPC) permissions response.

    Used as-is for both PC and NPC endpoints: `Character.can_be_edited_by_roles` already
    resolves `is_owner` only for a PC (`self.is_pc`), so no PC-specific subclass is needed —
    unlike `PcAccessSerializer`, which does need its own `_get_is_owner` for the identity
    (`access.json`) side.
    """

    def _get_can_edit(self, character):
        """Return whether the requester (real or role-simulated) may edit the character."""
        if character is None:
            return False
        roles = self._roles()
        if roles is not None:
            return character.can_be_edited_by_roles(
                roles['is_superuser'], roles['is_dm'], roles['is_owner']
            )
        return character.can_be_edited_by(self._user())
