"""View for updating a single game task's detail."""

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from ...authentication import CookieTokenAuthentication
from ...models import Game, Task
from ...permissions import TaskEditPermission
from ...serializers import GameTaskListSerializer, GameTaskUpdateSerializer
from ..common import validated_or_error


@api_view(['PATCH'])
@authentication_classes([CookieTokenAuthentication])
# AllowAny: authorisation is enforced inline below via TaskEditPermission.check(),
# since this route has no GET counterpart to gate (Task has no public read path).
@permission_classes([AllowAny])
def game_task_detail(request, game_slug, task_id):
    """Update a specific task of the given game."""
    game = get_object_or_404(Game, game_slug=game_slug)
    task = get_object_or_404(Task, id=task_id, game=game)

    error_response = TaskEditPermission.check(request, task)
    if error_response:
        return error_response

    serializer = GameTaskUpdateSerializer(
        task, data=request.data, partial=True, context={'game': game},
    )
    error_response = validated_or_error(serializer)
    if error_response:
        return error_response

    serializer.save()
    return Response(GameTaskListSerializer(task).data)
