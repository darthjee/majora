"""Poll option write serializer for the games app."""

from rest_framework import serializers

from games.models import PollOption


class PollOptionWriteSerializer(serializers.ModelSerializer):
    """Serializer for creating a poll option nested inside `PollCreateSerializer`."""

    class Meta:
        """Metadata for the PollOptionWriteSerializer."""

        model = PollOption
        fields = ['option']
        extra_kwargs = {'option': {'required': True}}
