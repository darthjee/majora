"""Game master serializer for the games app."""

from rest_framework import serializers

from games.models import GameMaster


class GameMasterSerializer(serializers.ModelSerializer):

    """Serializer for game master (DM) assignments."""

    class Meta:
        model = GameMaster
        fields = ['id', 'user']
