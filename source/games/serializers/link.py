"""Link serializer for the games app."""

from rest_framework import serializers

from games.models import Link


class LinkSerializer(serializers.ModelSerializer):

    """Serializer for game links."""

    class Meta:
        model = Link
        fields = ['id', 'text', 'url']
