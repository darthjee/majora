"""Treasure update serializer for the games app."""

from rest_framework import serializers

from games.models import Treasure


class TreasureUpdateSerializer(serializers.ModelSerializer):

    """Serializer for partial updates to a treasure."""

    class Meta:
        model = Treasure
        fields = ['name', 'value']
        extra_kwargs = {field: {'required': False} for field in fields}
