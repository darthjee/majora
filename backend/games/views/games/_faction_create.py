"""Implementation for the game-level faction-creation endpoint (issue #812)."""

from rest_framework import serializers
from rest_framework.response import Response

from permissions import EndpointPermission

from ...models import Faction
from ...serializers import FactionListSerializer
from ..common import validated_or_error


class _FactionCreateSerializer(serializers.Serializer):
    """Validate the name payload for creating a bare faction.

    `name` isn't a `ModelSerializer` field here (no `game` field is exposed to derive an
    automatic `UniqueTogetherValidator` from `Faction`'s `unique_faction_name_per_game`
    constraint), so uniqueness against `self.context['game']` is checked explicitly instead,
    turning what would otherwise be an unhandled `IntegrityError` into a normal 400.
    """

    name = serializers.CharField(max_length=200)

    def validate_name(self, value):
        """Reject a name already used by another faction in the same game."""
        game = self.context['game']
        if Faction.objects.filter(game=game, name=value).exists():
            raise serializers.ValidationError('faction_name_taken', code='faction_name_taken')
        return value


def faction_create(request, game):
    """Create a new Faction for `game`."""
    error_response = EndpointPermission(request.user, game=game).check(
        request, 'game_faction', 'regular', 'create',
    )
    if error_response:
        return error_response

    serializer = _FactionCreateSerializer(data=request.data, context={'game': game})
    error_response = validated_or_error(serializer)
    if error_response:
        return error_response

    faction = Faction.objects.create(game=game, **serializer.validated_data)
    return Response(FactionListSerializer(faction).data, status=201)
