"""Treasure update serializer for the games app."""

from rest_framework import serializers

from games.models import Treasure


class TreasureUpdateSerializer(serializers.ModelSerializer):
    """Serializer for partial updates to a treasure."""

    value = serializers.IntegerField(required=False, min_value=0)

    class Meta:
        """Metadata for the TreasureUpdateSerializer."""

        model = Treasure
        fields = ['name', 'value']
        extra_kwargs = {'name': {'required': False}}
