"""Character detail serializer for the games app."""

from rest_framework import serializers

from games.models import Character
from games.permissions import (
    CharacterMoneyEditPermission,
    CharacterPhotoUploadPermission,
    CharacterTreasureExchangePermission,
)
from games.serializers.characters._treasure_value import resolve_treasure_value
from games.serializers.characters.character_link import CharacterLinkSerializer


class CharacterDetailSerializer(serializers.ModelSerializer):
    """Serializer for character detail view including links."""

    links = CharacterLinkSerializer(many=True, read_only=True)
    is_pc = serializers.ReadOnlyField()
    game_slug = serializers.ReadOnlyField(source='game.game_slug')
    can_edit = serializers.SerializerMethodField()
    can_edit_money = serializers.SerializerMethodField()
    can_exchange_treasure = serializers.SerializerMethodField()
    can_set_profile_photo = serializers.SerializerMethodField()
    profile_photo_path = serializers.CharField(
        source='profile_photo.path', default=None, read_only=True
    )
    profile_photo_id = serializers.IntegerField(
        source='profile_photo.id', default=None, read_only=True
    )
    treasure_value = serializers.SerializerMethodField()

    class Meta:
        """Metadata for the CharacterDetailSerializer."""

        model = Character
        fields = [
            'id',
            'name',
            'role',
            'public_description',
            'is_pc',
            'links',
            'game_slug',
            'can_edit',
            'can_edit_money',
            'can_exchange_treasure',
            'can_set_profile_photo',
            'profile_photo_path',
            'profile_photo_id',
            'money',
            'treasure_value',
            'public_slain',
            'public_allegiance',
        ]

    def get_can_edit(self, obj):
        """Return whether the requesting user (from context) may edit this character."""
        request = self.context.get('request')
        user = request.user if request else None
        return obj.can_be_edited_by(user)

    def get_can_edit_money(self, obj):
        """Return whether the requesting user (from context) may edit this character's money."""
        request = self.context.get('request')
        user = request.user if request else None
        return CharacterMoneyEditPermission.is_allowed(user, obj)

    def get_can_exchange_treasure(self, obj):
        """Return whether the requesting user (from context) may exchange treasure for `obj`."""
        request = self.context.get('request')
        user = request.user if request else None
        return CharacterTreasureExchangePermission.is_allowed(user, obj)

    def get_can_set_profile_photo(self, obj):
        """Return whether the requesting user (from context) may set `obj`'s profile photo."""
        request = self.context.get('request')
        user = request.user if request else None
        return CharacterPhotoUploadPermission.is_allowed(user, obj)

    def get_treasure_value(self, obj):
        """Return the character's total treasure value."""
        return resolve_treasure_value(obj)
