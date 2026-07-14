"""Minimal update serializer for the player-facing NPC slain-toggle endpoint."""

from rest_framework import serializers

from games.models import Character


class NpcSlainUpdateSerializer(serializers.ModelSerializer):
    """Validate the narrow `{"slain": ...}` payload, writing straight to `public_slain`.

    Deliberately narrower than `CharacterUpdateSerializer`: this only ever maps the wire-level
    `slain` key onto `Character.public_slain` — the real `slain` field stays `full.json`-only.
    """

    slain = serializers.BooleanField(source='public_slain')

    class Meta:
        """Metadata for the NpcSlainUpdateSerializer."""

        model = Character
        fields = ['slain']
