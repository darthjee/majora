"""GameDocument update serializer for the games app."""

from rest_framework import serializers

from games.models import GameDocument


class GameDocumentUpdateSerializer(serializers.ModelSerializer):
    """Serializer for the limited set of fields that may be edited on a game document."""

    class Meta:
        """Metadata for the GameDocumentUpdateSerializer."""

        model = GameDocument
        fields = ['name', 'description', 'hidden']
        extra_kwargs = {field: {'required': False} for field in fields}
