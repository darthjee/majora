"""View for listing a poll's votes, or casting the requesting user's own vote(s)."""

from django.core.exceptions import ValidationError
from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from ...authentication import CookieTokenAuthentication
from ...models import Game, Poll, PollVote
from ...permissions import PollVotePermission
from ...poll_vote_writer import MultiplePollVoteWriter, SinglePollVoteWriter
from ...serializers import PollVoteSerializer, PollVoteWriteSerializer
from ..common import validated_or_error


@api_view(['GET', 'PUT'])
@authentication_classes([CookieTokenAuthentication])
# AllowAny: authorisation is enforced inline below via PollVotePermission, since GET and
# PUT have different rules (view allows the superuser/staff bypass, voting does not) — there
# is no public read path.
@permission_classes([AllowAny])
def game_poll_votes(request, game_slug, poll_id):
    """Return a poll's votes, or cast the requesting user's own vote(s) for it."""
    game = get_object_or_404(Game, game_slug=game_slug)
    poll = get_object_or_404(Poll, id=poll_id, game=game)

    if request.method == 'PUT':
        error_response = PollVotePermission.check_vote(request, game)
        if error_response:
            return error_response
        return _cast_votes(request, poll)

    error_response = PollVotePermission.check_view(request, game)
    if error_response:
        return error_response
    return _list_votes(request, poll)


def _list_votes(request, poll):
    """Serialize `poll`'s votes, optionally filtered by the `user_id` query param."""
    queryset = _PollVoteQuerySet(poll).filter_by_user_id(request.query_params.get('user_id'))
    serializer = PollVoteSerializer(queryset, many=True)
    return _skip_cache_response(serializer.data)


def _cast_votes(request, poll):
    """Validate the payload and persist the requesting user's vote(s) for `poll`."""
    if poll.status != Poll.STATUS_OPEN:
        return Response({'errors': {'detail': ['Poll must be open to accept votes.']}}, status=400)

    serializer = PollVoteWriteSerializer(data=request.data, context={'poll': poll})
    error_response = validated_or_error(serializer)
    if error_response:
        return error_response

    writer_cls = SinglePollVoteWriter if poll.type == Poll.TYPE_SINGLE else MultiplePollVoteWriter
    try:
        votes = writer_cls.write(
            poll, request.user, serializer.validated_data['option_ids'],
        )
    except ValidationError as exc:
        return Response({'errors': {'option_ids': exc.messages}}, status=400)

    return _skip_cache_response(PollVoteSerializer(votes, many=True).data)


class _PollVoteQuerySet:
    """Build the votes queryset for a poll, optionally scoped to a single user."""

    def __init__(self, poll):
        """Store the poll whose votes are being queried."""
        self.poll = poll

    def filter_by_user_id(self, user_id):
        """Return `poll`'s votes, filtered to `user_id` when it is a valid integer."""
        queryset = PollVote.objects.filter(option__poll=self.poll)
        if user_id is not None:
            try:
                queryset = queryset.filter(user_id=int(user_id))
            except (TypeError, ValueError):
                pass
        return queryset


def _skip_cache_response(data, status=200):
    """Build a Response for `data` with the shared `X-Skip-Cache` header set."""
    response = Response(data, status=status)
    response['X-Skip-Cache'] = 'true'
    return response
