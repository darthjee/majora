"""Fallback resolution helpers for CharacterDocument fields that mirror their GameDocument's
values.

Simpler than `games/treasures/game_treasure_fields.py`'s context-lookup pattern: the
fallback source (`character_document.game_document`) is a direct FK, not something resolved
via a separate link table plus a context game.
"""


def resolve_character_document_field(character_document, field):
    """Return `character_document`'s `field`, falling back to its `game_document`'s same field.

    Used for `name`/`description`/`photo`-style fields a `CharacterDocument` may leave `null`
    to inherit its linked `GameDocument`'s value. Never used for `hidden`, which is a plain
    field on both models and is never inherited.
    """
    value = getattr(character_document, field)
    if value is not None:
        return value
    return getattr(character_document.game_document, field)


def resolve_character_document_photo_path(character_document):
    """Return the resolved photo path for `character_document`, or `None` if neither has one."""
    photo = resolve_character_document_field(character_document, 'photo')
    return None if photo is None else photo.path
