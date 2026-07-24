"""Implementation for the game-level document-creation endpoint (issue #758)."""

from rest_framework import serializers
from rest_framework.response import Response

from ...models import GameDocument
from ...permissions import GameDocumentCreatePermission
from ...serializers import GameDocumentDetailFullSerializer
from ..common import validated_or_error


class _GameDocumentCreateSerializer(serializers.Serializer):
    """Validate the name/description/hidden payload for creating a bare game document."""

    name = serializers.CharField(max_length=200)
    description = serializers.CharField(required=False, default='', allow_blank=True)
    hidden = serializers.BooleanField(required=False, default=False)


def game_document_create(request, game):
    """Create a new GameDocument for `game`, with no owning CharacterDocument."""
    error_response = GameDocumentCreatePermission.check(request, game)
    if error_response:
        return error_response

    serializer = _GameDocumentCreateSerializer(data=request.data)
    error_response = validated_or_error(serializer)
    if error_response:
        return error_response

    document = GameDocument.objects.create(game=game, **serializer.validated_data)
    return Response(GameDocumentDetailFullSerializer(document).data, status=201)
