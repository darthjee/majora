"""CharacterItem serializer for the games app."""

from rest_framework import serializers

from games.models import CharacterItem
from games.serializers.games.items.character_item_fields import (
    resolve_character_item_field,
    resolve_character_item_photo_path,
)
from games.serializers.hidden_field_mixin import HiddenFieldMixin


class CharacterItemSerializer(serializers.ModelSerializer):
    """Serializer for a character's item assignment."""

    game_item_id = serializers.IntegerField(source='game_item.id', read_only=True)
    name = serializers.SerializerMethodField()
    photo_path = serializers.SerializerMethodField()

    def get_name(self, character_item):
        """Return the character item's name, falling back to its game item's name."""
        return resolve_character_item_field(character_item, 'name')

    def get_photo_path(self, character_item):
        """Return the character item's resolved photo path."""
        return resolve_character_item_photo_path(character_item)

    class Meta:
        """Metadata for the CharacterItemSerializer."""

        model = CharacterItem
        fields = ['id', 'game_item_id', 'name', 'photo_path']


class CharacterItemAllSerializer(HiddenFieldMixin, CharacterItemSerializer):
    """Serializer for a character's item assignment, including hidden items (DM-only).

    Used only by the `/items/all.json` variants — adds `hidden` on top of everything
    `CharacterItemSerializer` already exposes; the regular, player-facing items list keeps
    omitting it entirely.
    """

    class Meta(CharacterItemSerializer.Meta):
        """Metadata for the CharacterItemAllSerializer."""

        fields = CharacterItemSerializer.Meta.fields + ['hidden']


class CharacterItemDetailSerializer(CharacterItemSerializer):
    """Serializer for a character's single item assignment detail view.

    Used only by the plain item-detail endpoints — adds `description` on top of
    everything `CharacterItemSerializer` already exposes; the index/list view keeps
    omitting it entirely.
    """

    description = serializers.SerializerMethodField()

    def get_description(self, character_item):
        """Return the character item's description, falling back to its game item's."""
        return resolve_character_item_field(character_item, 'description')

    class Meta(CharacterItemSerializer.Meta):
        """Metadata for the CharacterItemDetailSerializer."""

        fields = CharacterItemSerializer.Meta.fields + ['description']


class CharacterItemDetailFullSerializer(HiddenFieldMixin, CharacterItemDetailSerializer):
    """Serializer for a character's single item assignment detail view, including
    hidden items (DM-only).

    Used only by the item-detail-full endpoints — adds `hidden` on top of everything
    `CharacterItemDetailSerializer` already exposes.
    """

    class Meta(CharacterItemDetailSerializer.Meta):
        """Metadata for the CharacterItemDetailFullSerializer."""

        fields = CharacterItemDetailSerializer.Meta.fields + ['hidden']
