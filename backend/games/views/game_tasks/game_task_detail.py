"""View for retrieving or updating a single game task's detail."""

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from permissions import EndpointPermission

from ...decorators import restricted
from ...models import Game, Task
from ...serializers import GameTaskListSerializer, GameTaskUpdateSerializer
from ..common import validated_or_error


@restricted
@api_view(['GET', 'PATCH'])
# AllowAny: authorisation is enforced inline below via EndpointPermission.check(),
# since Task has no public read path (GET is gated the same as PATCH).
@permission_classes([AllowAny])
def game_task_detail(request, game_slug, task_id):
    """Return or update a specific task of the given game."""
    game = get_object_or_404(Game, game_slug=game_slug)
    task = get_object_or_404(Task, id=task_id, game=game)

    error_response = EndpointPermission(request.user, game=game).check(
        request, 'game_task', 'restricted', 'edit',
    )
    if error_response:
        return error_response

    if request.method == 'GET':
        return Response(GameTaskListSerializer(task).data)

    serializer = GameTaskUpdateSerializer(
        task, data=request.data, partial=True, context={'game': game},
    )
    error_response = validated_or_error(serializer)
    if error_response:
        return error_response

    serializer.save()
    return Response(GameTaskListSerializer(task).data)
