"""Scope catalogue for scoped API tokens (see `docs/agents/specs/client/scopes.md`).

This module is the single source of truth for the scopes a token may carry. The
decorator, the authentication check, token creation and the token UI options all
read from it.
"""

FAMILIES = (
    'games',
    'players',
    'pcs',
    'npcs',
    'documents',
    'factions',
    'items',
    'common_items',
    'possessions',
    'recipes',
    'treasures',
    'sessions',
    'polls',
    'tasks',
    'conversations',
    'miniatures',
)

READ = 'read'
WRITE = 'write'
ACTIONS = (READ, WRITE)

SCOPES = tuple(f'{family}:{action}' for family in FAMILIES for action in ACTIONS)

METHOD_ACTIONS = {
    'GET': READ,
    'POST': WRITE,
    'PUT': WRITE,
    'PATCH': WRITE,
    'DELETE': WRITE,
}


def effective_scopes(api_token):
    """Return the token's stored scopes that are still in the catalogue, as a frozenset."""
    stored = api_token.scopes if isinstance(api_token.scopes, list) else []
    return frozenset(scope for scope in stored if scope in SCOPES)
