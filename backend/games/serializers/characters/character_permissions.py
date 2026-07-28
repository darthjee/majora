"""Character permissions serializer for the games app; shared by the PC and NPC endpoints."""

from games.permissions import (
    CharacterItemPhotoUploadPermission,
    CharacterItemPlayerCreatePermission,
    CharacterMoneyEditPermission,
    CharacterPhotoDeletePermission,
    CharacterPhotoUploadPermission,
    CharacterTreasureExchangePermission,
)
from games.serializers.base_permissions import BasePermissionsSerializer


class CharacterPermissionsSerializer(BasePermissionsSerializer):
    """Serializes every per-character permission flag for the permissions.json endpoint.

    Used as-is for both PC and NPC endpoints: `Character.can_be_edited_by_roles` already
    resolves `is_owner` only for a PC (`self.is_pc`), so no PC-specific subclass is needed —
    unlike `PcAccessSerializer`, which does need its own `_get_is_owner` for the identity
    (`access.json`) side.
    """

    def to_representation(self, obj):
        """Build the permissions response dict for every can_* permission flag."""
        data = super().to_representation(obj)
        data['can_create_item'] = self._get_can_create_item(obj)
        data['can_upload_item_photo'] = self._get_can_upload_item_photo(obj)
        data['can_edit_money'] = self._get_can_edit_money(obj)
        data['can_exchange_treasure'] = self._get_can_exchange_treasure(obj)
        data['can_set_profile_photo'] = self._get_can_set_profile_photo(obj)
        data['can_delete_photo'] = self._get_can_delete_photo(obj)
        return data

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

    def _get_can_create_item(self, character):
        """Return whether the requester (real or role-simulated) may create an item."""
        if character is None:
            return False
        roles = self._roles()
        if roles is not None:
            return CharacterItemPlayerCreatePermission.is_allowed_for_roles(
                roles['is_superuser'], roles['is_dm'], roles['is_owner'], roles['is_staff'],
                roles['is_player'], character.is_pc,
            )
        return CharacterItemPlayerCreatePermission.is_allowed(self._user(), character)

    def _get_can_upload_item_photo(self, character):
        """Return whether the requester (real or role-simulated) may upload an item photo."""
        if character is None:
            return False
        roles = self._roles()
        if roles is not None:
            return CharacterItemPhotoUploadPermission.is_allowed_for_roles(
                roles['is_superuser'], roles['is_dm'], roles['is_owner'], roles['is_staff'],
                roles['is_player'], character.is_pc,
            )
        return CharacterItemPhotoUploadPermission.is_allowed(self._user(), character)

    def _get_can_edit_money(self, character):
        """Return whether the requester (real or role-simulated) may edit the character's money."""
        if character is None:
            return False
        roles = self._roles()
        if roles is not None:
            return CharacterMoneyEditPermission.is_allowed_for_roles(
                roles['is_superuser'], roles['is_dm'], roles['is_owner'], roles['is_staff'],
                roles['is_player'], character.is_pc,
            )
        return CharacterMoneyEditPermission.is_allowed(self._user(), character)

    def _get_can_exchange_treasure(self, character):
        """Return whether the requester (real or role-simulated) may exchange treasure."""
        if character is None:
            return False
        roles = self._roles()
        if roles is not None:
            return CharacterTreasureExchangePermission.is_allowed_for_roles(
                roles['is_superuser'], roles['is_dm'], roles['is_owner'], roles['is_staff'],
                character.is_pc,
            )
        return CharacterTreasureExchangePermission.is_allowed(self._user(), character)

    def _get_can_set_profile_photo(self, character):
        """Return whether the requester (real or role-simulated) may set the profile photo."""
        if character is None:
            return False
        roles = self._roles()
        if roles is not None:
            return CharacterPhotoUploadPermission.is_allowed_for_roles(
                roles['is_superuser'], roles['is_dm'], roles['is_owner'], roles['is_staff'],
                roles['is_player'], character.is_pc,
            )
        return CharacterPhotoUploadPermission.is_allowed(self._user(), character)

    def _get_can_delete_photo(self, character):
        """Return whether the requester (real or role-simulated) may delete a photo."""
        if character is None:
            return False
        roles = self._roles()
        if roles is not None:
            return CharacterPhotoDeletePermission.is_allowed_for_roles(
                roles['is_superuser'], roles['is_dm'], roles['is_staff'],
            )
        return CharacterPhotoDeletePermission.is_allowed(self._user(), character)
