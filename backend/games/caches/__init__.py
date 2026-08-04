"""Per-type wrappers around the shared process-wide memory cache (`majora_project.cache`).

Each class here fixes its own cache "type" string and key-building rule for one consumer
of the cache: the admin-or-staff, Game DM/player, and PC/NPC character-editor permission
checks (per issue #704), the request-hostname-to-`Game`-ids resolution (per issue #963),
and the set of every registered domain (per issue #965).
"""

from .admin_or_staff_cache import AdminOrStaffCache
from .character_editor_cache import CharacterEditorCache
from .domain_games_cache import DomainGamesCache
from .game_player_cache import GamePlayerCache
from .registered_domains_cache import RegisteredDomainsCache

__all__ = [
    'AdminOrStaffCache',
    'GamePlayerCache',
    'CharacterEditorCache',
    'DomainGamesCache',
    'RegisteredDomainsCache',
]
