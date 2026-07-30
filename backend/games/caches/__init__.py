"""Per-type wrappers around the shared process-wide memory cache (`majora_project.cache`).

Each class here fixes its own cache "type" string and key-building rule for one of the
existing permission checks that consume the cache, per issue #704: admin-or-staff, Game
DM/player, and the PC/NPC character-editor checks.
"""

from .admin_or_staff_cache import AdminOrStaffCache
from .character_editor_cache import CharacterEditorCache
from .game_player_cache import GamePlayerCache

__all__ = ['AdminOrStaffCache', 'GamePlayerCache', 'CharacterEditorCache']
