"""Game reference serializer used by the scoped API token payloads."""

from rest_framework import serializers


class ApiTokenGameSerializer(serializers.Serializer):
    """Serialize a `Game` as the `{slug, name}` pair the token payloads carry."""

    slug = serializers.CharField(source='game_slug', read_only=True)
    name = serializers.CharField(read_only=True)
