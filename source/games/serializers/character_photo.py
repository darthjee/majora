"""CharacterPhoto serializer for the games app."""

from rest_framework import serializers

from games.models import CharacterPhoto


class CharacterPhotoSerializer(serializers.ModelSerializer):
    """Serializer for character photos."""

    class Meta:
        """Metadata for the CharacterPhotoSerializer."""

        model = CharacterPhoto
        fields = ['id', 'path']
