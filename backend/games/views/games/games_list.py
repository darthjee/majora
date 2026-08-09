"""View for listing all games or creating a new one."""

from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from accounts.authentication import CookieTokenAuthentication
from domains.models import Domain

from ...caches import DomainGamesCache, RegisteredDomainsCache
from ...models import Game, Player
from ...serializers import GameCreateSerializer, GameDetailSerializer, GameListSerializer
from ..common import paginated_list_response, require_authenticated, validated_or_error

UNRECOGNIZED_DOMAIN_RESPONSE_DATA = {'errors': {'detail': ['domain_not_recognized']}}


@api_view(['GET', 'POST'])
@authentication_classes([CookieTokenAuthentication])
# AllowAny: GET is an intentionally public listing; POST authentication is enforced
# inline inside _create_game so that unauthenticated callers receive a proper 401.
@permission_classes([AllowAny])
def games_list(request):
    """Return a list of all games or create a new game, scoping both to the requesting host."""
    host = request.get_host().split(':')[0].lower()
    if host not in RegisteredDomainsCache.domains():
        response = Response(UNRECOGNIZED_DOMAIN_RESPONSE_DATA, status=404)
        response['X-Skip-Cache'] = 'true'
        return response

    if request.method == 'POST':
        response = _create_game(request, domain=host)
        response['X-Skip-Cache'] = 'true'
    else:
        games = Game.objects.filter(id__in=DomainGamesCache.game_ids_for_domain(host))
        response = paginated_list_response(request, games, GameListSerializer)
    return response


def _create_game(request, domain=None):
    """Validate request and create a new game, returning 201 with detail data.

    When `domain` is given (per-domain mode), the new game is also attached to that
    domain's `DomainGroup` so it remains visible on the domain that created it.
    """
    error_response = require_authenticated(request)
    if error_response:
        return error_response

    serializer = GameCreateSerializer(data=request.data)
    error_response = validated_or_error(serializer)
    if error_response:
        return error_response

    game = serializer.save()
    if domain is not None:
        game_domain = Domain.objects.get(domain=domain)
        game.game_domain_groups.add(game_domain.domain_group)
    Player.objects.get_or_create(
        game=game,
        user=request.user,
        defaults={'name': _dm_display_name(request.user), 'is_dm': True},
    )
    detail = GameDetailSerializer(game)
    return Response(detail.data, status=201)


def _dm_display_name(user):
    """Return `user`'s profile display name, falling back to their username when unset."""
    profile = getattr(user, 'profile', None)
    if profile and profile.display_name:
        return profile.display_name
    return user.username
