"""Fallback resolution helpers for CharacterItem fields that mirror their GameItem's values.

Simpler than `games/treasures/game_treasure_fields.py`'s context-lookup pattern: the
fallback source (`character_item.game_item`) is a direct FK, not something resolved via a
separate link table plus a context game.
"""


def resolve_character_item_field(character_item, field):
    """Return `character_item`'s `field`, falling back to its `game_item`'s same field.

    Used for `name`/`description`/`photo`-style fields a `CharacterItem` may leave `null` to
    inherit its linked `GameItem`'s value. Never used for `hidden`, which is a plain field on
    both models and is never inherited.
    """
    value = getattr(character_item, field)
    if value is not None:
        return value
    return getattr(character_item.game_item, field)


def resolve_character_item_photo_path(character_item):
    """Return the resolved photo path for `character_item`, or `None` if neither has one."""
    photo = resolve_character_item_field(character_item, 'photo')
    return None if photo is None else photo.path
