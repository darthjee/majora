"""Cache wrapper for the PC/NPC editor boolean permission check."""

from .boolean_check_cache import _BooleanCheckCache


class CharacterEditorCache(_BooleanCheckCache):
    """Cache whether a user is an explicit editor (player or DM) of a character.

    Kept as two distinct cache types (PC vs NPC) even though both branch through the same
    `Character.editors` query, matching the issue's explicit PC (DM or owner) / NPC (DM)
    split. Keyed by user id and character id.
    """

    PC_CACHE_TYPE = 'pc_editor'
    NPC_CACHE_TYPE = 'npc_editor'

    @classmethod
    def is_editor(cls, character, user):
        """Return whether `user` may edit `character`, using the shared memory cache."""
        entry_type = cls.PC_CACHE_TYPE if character.is_pc else cls.NPC_CACHE_TYPE
        key = (user.id, character.id)
        return cls._get_or_compute(
            entry_type, key, lambda: character.editors.filter(id=user.id).exists()
        )
