"""View for listing a game's tasks or creating a new one."""

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from ...authentication import CookieTokenAuthentication
from ...models import Game
from ...permissions import TaskEditPermission
from ...serializers import GameTaskCreateSerializer, GameTaskListSerializer
from ..common import paginated_list_response, validated_or_error


@api_view(['GET', 'POST'])
@authentication_classes([CookieTokenAuthentication])
# AllowAny: authorisation is enforced inline below via TaskEditPermission.check(),
# since Tasks have no public read path (unlike GameSession/Treasure, GET is also gated).
@permission_classes([AllowAny])
def game_tasks_list(request, game_slug):
    """Return a paginated list of a game's tasks, or create a new one."""
    game = get_object_or_404(Game, game_slug=game_slug)

    error_response = TaskEditPermission.check(request, game)
    if error_response:
        return error_response

    if request.method == 'POST':
        return _create_task(request, game)

    return paginated_list_response(request, game.tasks.all(), GameTaskListSerializer)


def _create_task(request, game):
    """Validate the request and create a new task for the game, returning 201 detail data."""
    serializer = GameTaskCreateSerializer(data=request.data, context={'game': game})
    error_response = validated_or_error(serializer)
    if error_response:
        return error_response

    task = serializer.save(game=game)
    detail = GameTaskListSerializer(task)
    return Response(detail.data, status=201)
