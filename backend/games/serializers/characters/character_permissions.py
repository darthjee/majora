"""Character permissions serializer for the games app; shared by the PC and NPC endpoints."""

from games.permissions import Roles, UIPermission
from games.serializers.base_permissions import BasePermissionsSerializer


class CharacterPermissionsSerializer(BasePermissionsSerializer):
    """Serializes every per-character permission flag for the permissions.json endpoint.

    Used as-is for both PC and NPC endpoints: `UIPermission` already resolves `owner` only
    for a PC (via `Roles.is_owner()`), so no PC-specific subclass is needed — unlike
    `PcAccessSerializer`, which does need its own `_get_is_owner` for the identity
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

    def _character_resource(self, character):
        """Return the permissions resource name ('game_pc'/'game_npc') for `character`."""
        return 'game_pc' if character.is_pc else 'game_npc'

    def _character_item_resource(self, character):
        """Return the permissions resource name ('game_pc_item'/'game_npc_item')."""
        return 'game_pc_item' if character.is_pc else 'game_npc_item'

    def _ui_permission(self, character):
        """Build a `UIPermission` for `character`, honoring the `?role=` simulated path."""
        roles = self._roles()
        if roles is not None:
            simulated_roles = Roles.from_booleans(
                is_superuser=roles['is_superuser'], is_dm=roles['is_dm'],
                is_owner=roles['is_owner'], is_staff=roles['is_staff'],
                is_player=roles['is_player'],
            )
            return UIPermission(roles=simulated_roles)
        return UIPermission(user=self._user(), game=character.game, pc=character)

    def _get_can_edit(self, character):
        """Return whether the requester (real or role-simulated) may edit the character."""
        if character is None:
            return False
        return self._ui_permission(character).allowed(self._character_resource(character), 'edit')

    def _get_can_create_item(self, character):
        """Return whether the requester (real or role-simulated) may create an item."""
        if character is None:
            return False
        return self._ui_permission(character).allowed(
            self._character_item_resource(character), 'create_update',
        )

    def _get_can_upload_item_photo(self, character):
        """Return whether the requester (real or role-simulated) may upload an item photo."""
        if character is None:
            return False
        return self._ui_permission(character).allowed(
            self._character_item_resource(character), 'photo_upload',
        )

    def _get_can_edit_money(self, character):
        """Return whether the requester (real or role-simulated) may edit the character's money."""
        if character is None:
            return False
        return self._ui_permission(character).allowed(
            self._character_resource(character), 'money_edit',
        )

    def _get_can_exchange_treasure(self, character):
        """Return whether the requester (real or role-simulated) may exchange treasure."""
        if character is None:
            return False
        return self._ui_permission(character).allowed(
            self._character_resource(character), 'treasure_exchange',
        )

    def _get_can_set_profile_photo(self, character):
        """Return whether the requester (real or role-simulated) may set the profile photo."""
        if character is None:
            return False
        return self._ui_permission(character).allowed(
            self._character_resource(character), 'photo_upload',
        )

    def _get_can_delete_photo(self, character):
        """Return whether the requester (real or role-simulated) may delete a photo."""
        if character is None:
            return False
        return self._ui_permission(character).allowed(
            self._character_resource(character), 'photo_delete',
        )
