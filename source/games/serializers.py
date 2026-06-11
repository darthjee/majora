"""Serializers for the games app."""

from rest_framework import serializers

from .models import Character, Game, Link, Photo


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
        fields = ['name', 'game_slug', 'photo', 'links']


class CharacterListSerializer(serializers.ModelSerializer):
    """Serializer for character list items."""

    class Meta:
        model = Character
        fields = ['id', 'name', 'avatar_url']


class CharacterDetailSerializer(serializers.ModelSerializer):
    """Serializer for character detail view including photos."""

    photos = PhotoSerializer(many=True, read_only=True)
    is_pc = serializers.ReadOnlyField()

    class Meta:
        model = Character
        fields = [
            'id',
            'name',
            'avatar_url',
            'character_class',
            'level',
            'description',
            'is_pc',
            'photos',
        ]
