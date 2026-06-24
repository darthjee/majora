"""Serializers for the games app."""

from rest_framework import serializers

from .models import Character, Game, GameMaster, Link, Photo


class LinkSerializer(serializers.ModelSerializer):
    """Serializer for game links."""

    class Meta:
        model = Link
        fields = ['id', 'text', 'url']


class PhotoSerializer(serializers.ModelSerializer):
    """Serializer for character photos."""

    class Meta:
        model = Photo
        fields = ['id', 'url']


class GameListSerializer(serializers.ModelSerializer):
    """Serializer for game list items."""

    class Meta:
        model = Game
        fields = ['name', 'game_slug', 'photo']


class GameDetailSerializer(serializers.ModelSerializer):
    """Serializer for game detail view including links."""

    links = LinkSerializer(many=True, read_only=True)

    class Meta:
        model = Game
        fields = ['name', 'game_slug', 'photo', 'description', 'links']


class CharacterListSerializer(serializers.ModelSerializer):
    """Serializer for character list items."""

    game_slug = serializers.ReadOnlyField(source='game.game_slug')

    class Meta:
        model = Character
        fields = ['id', 'name', 'avatar_url', 'game_slug']


class CharacterDetailSerializer(serializers.ModelSerializer):
    """Serializer for character detail view including photos."""

    photos = PhotoSerializer(many=True, read_only=True)
    is_pc = serializers.ReadOnlyField()
    game_slug = serializers.ReadOnlyField(source='game.game_slug')
    can_edit = serializers.SerializerMethodField()

    class Meta:
        model = Character
        fields = [
            'id',
            'name',
            'avatar_url',
            'character_class',
            'level',
            'public_description',
            'is_pc',
            'photos',
            'game_slug',
            'can_edit',
        ]

    def get_can_edit(self, obj):
        """Return whether the requesting user (from context) may edit this character."""
        request = self.context.get('request')
        user = request.user if request else None
        return obj.can_be_edited_by(user)


class GameMasterSerializer(serializers.ModelSerializer):
    """Serializer for game master (DM) assignments."""

    class Meta:
        model = GameMaster
        fields = ['id', 'user']


class CharacterUpdateSerializer(serializers.ModelSerializer):
    """Serializer for the limited set of fields a player may edit on their PC."""

    class Meta:
        model = Character
        fields = ['name', 'avatar_url', 'character_class', 'level', 'public_description', 'private_description']
        extra_kwargs = {field: {'required': False} for field in fields}


class CharacterFullSerializer(CharacterDetailSerializer):
    """Serializer for full character detail including the private description."""

    class Meta(CharacterDetailSerializer.Meta):
        fields = CharacterDetailSerializer.Meta.fields + ['private_description']
