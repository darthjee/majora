"""CharacterItem update serializer for the games app."""

from rest_framework import serializers

from games.models import CharacterItem


class CharacterItemUpdateSerializer(serializers.ModelSerializer):
    """Serializer for the limited set of fields that may be edited on a character item.

    Unlike `GameItemUpdateSerializer`, a blank `name`/`description` is accepted and mapped
    to `None` in `validate`, so the value persists as `null` and falls back to the linked
    `GameItem`'s value (`resolve_character_item_field`) rather than as an empty string.
    `hidden` has no such fallback and is left untouched.
    """

    class Meta:
        """Metadata for the CharacterItemUpdateSerializer."""

        model = CharacterItem
        fields = ['name', 'description', 'hidden']
        extra_kwargs = {
            'name': {'required': False, 'allow_null': True, 'allow_blank': True},
            'description': {'required': False, 'allow_null': True, 'allow_blank': True},
            'hidden': {'required': False},
        }

    def validate(self, attrs):
        """Map a blank `name`/`description` to `None` so it falls back to the `GameItem`."""
        for field in ('name', 'description'):
            if attrs.get(field) == '':
                attrs[field] = None
        return attrs
