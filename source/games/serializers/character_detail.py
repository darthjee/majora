"""Character detail serializer for the games app."""

from rest_framework import serializers

from games.models import Character
from games.serializers.character_link import CharacterLinkSerializer
from games.serializers.character_photo import CharacterPhotoSerializer


class CharacterDetailSerializer(serializers.ModelSerializer):

    """Serializer for character detail view including photos and links."""

    photos = CharacterPhotoSerializer(many=True, read_only=True)
    links = CharacterLinkSerializer(many=True, read_only=True)
    is_pc = serializers.ReadOnlyField()
    game_slug = serializers.ReadOnlyField(source='game.game_slug')
    can_edit = serializers.SerializerMethodField()
    profile_photo_path = serializers.CharField(
        source='profile_photo.path', default=None, read_only=True
    )

    class Meta:
        model = Character
        fields = [
            'id',
            'name',
            'avatar_url',
            'role',
            'public_description',
            'is_pc',
            'photos',
            'links',
            'game_slug',
            'can_edit',
            'profile_photo_path',
        ]

    def get_can_edit(self, obj):
        """Return whether the requesting user (from context) may edit this character."""
        request = self.context.get('request')
        user = request.user if request else None
        return obj.can_be_edited_by(user)
