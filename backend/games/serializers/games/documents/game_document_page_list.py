"""GameDocumentPage list serializer for the games app."""

from rest_framework import serializers

from games.models import GameDocumentPage


class GameDocumentPageListSerializer(serializers.ModelSerializer):
    """Serializer for game document page list items."""

    class Meta:
        """Metadata for the GameDocumentPageListSerializer."""

        model = GameDocumentPage
        fields = ['id', 'content', 'order']
