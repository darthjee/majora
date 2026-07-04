"""CharacterPhoto serializer for the games app."""

from rest_framework import serializers

from games.models import CharacterPhoto


class CharacterPhotoSerializer(serializers.ModelSerializer):

    """Serializer for character photos."""

    class Meta:
        model = CharacterPhoto
        fields = ['id', 'path']
