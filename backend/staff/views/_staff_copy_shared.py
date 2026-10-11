"""Shared lookups for the staff copy dispatch views (copy type, game-slug parameters)."""

from rest_framework.response import Response

from games.models import Game

from .. import copy_types


def find_copy_type(copy_type):
    """Return `(entry, None)`, or `(None, 404 Response)` when `copy_type` is not registered."""
    entry = copy_types.find(copy_type)
    if entry is None:
        return None, Response(status=404)
    return entry, None


def resolve_list_games(params):
    """Return `(from_game, to_game, None)`, or `(None, None, 400 Response)` when invalid."""
    resolver = GameSlugResolver(params)
    from_game = resolver.resolve('from')
    to_game = resolver.resolve('to')
    if not resolver.errors and from_game == to_game:
        resolver.add_error('to', 'same_game')
    if resolver.errors:
        return None, None, resolver.error_response()
    return from_game, to_game, None


def resolve_target_game(data):
    """Return `(target_game, None)`, or `(None, 400 Response)` when `target` is invalid."""
    resolver = GameSlugResolver(data if isinstance(data, dict) else {})
    target_game = resolver.resolve('target')
    if resolver.errors:
        return None, resolver.error_response()
    return target_game, None


def same_game_error(param):
    """Return the `400` Response rejecting `param` for pointing at the source's own game."""
    return Response({'errors': {param: ['same_game']}}, status=400)


class GameSlugResolver:
    """Resolves named game-slug parameters into games, collecting per-parameter error codes."""

    def __init__(self, params):
        """Store the parameter mapping (query params or request body) and start error-free."""
        self._params = params
        self.errors = {}

    def resolve(self, name):
        """Return the game whose slug is the `name` parameter, or None (recording the error)."""
        code, game = self._lookup(self._params.get(name))
        if code:
            self.add_error(name, code)
        return game

    def add_error(self, name, code):
        """Record the error `code` for the parameter `name`."""
        self.errors[name] = [code]

    def error_response(self):
        """Return the `400` Response carrying the collected error codes."""
        return Response({'errors': self.errors}, status=400)

    @staticmethod
    def _lookup(slug):
        """Return `(error_code_or_None, game_or_None)` for a raw parameter value."""
        if slug is None or slug == '':
            return 'required', None
        if not isinstance(slug, str):
            return 'invalid', None
        game = Game.objects.filter(game_slug=slug).first()
        return (None, game) if game else ('not_found', None)
