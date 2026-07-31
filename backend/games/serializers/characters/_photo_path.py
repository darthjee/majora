"""Shared helper for resolving a character's public photo path."""


def resolve_photo_path(character):
    """Return `character`'s photo path, or None when incognito or unset.

    An incognito character always resolves to None on the public serializers, regardless of
    whether a `photo` is set, hiding its portrait from players who haven't met it yet.
    """
    if character.incognito:
        return None
    return character.photo.path if character.photo else None
