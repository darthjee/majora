"""Scope catalogue for scoped API tokens (see `docs/agents/access-control/token-scopes.md`).

This module is the single source of truth for the scopes a token may carry. The
decorator, the authentication check, token creation and the token UI options all
read from it.
"""

READ = 'read'
WRITE = 'write'
ACTIONS = (READ, WRITE)
READ_ONLY = (READ,)

FAMILY_ACTIONS = (
    ('games', ACTIONS),
    ('players', ACTIONS),
    ('pcs', ACTIONS),
    ('npcs', ACTIONS),
    ('documents', ACTIONS),
    ('factions', ACTIONS),
    ('items', ACTIONS),
    ('common_items', ACTIONS),
    ('possessions', ACTIONS),
    ('recipes', ACTIONS),
    ('treasures', ACTIONS),
    ('sessions', ACTIONS),
    ('polls', ACTIONS),
    ('tasks', ACTIONS),
    ('conversations', ACTIONS),
    ('miniatures', ACTIONS),
    ('statistics', READ_ONLY),
)

FAMILIES = tuple(family for family, _ in FAMILY_ACTIONS)

SCOPES = tuple(
    f'{family}:{action}' for family, actions in FAMILY_ACTIONS for action in actions
)

STATISTICS_READ = 'statistics:read'

STAFF_ONLY_SCOPES = frozenset({STATISTICS_READ})

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
