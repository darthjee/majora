"""Shared helper for resolving a character's public profile photo path."""


def resolve_profile_photo_path(character):
    """Return `character`'s profile photo path, or None when incognito or unset.

    An incognito character always resolves to None on the public serializers, regardless of
    whether a `profile_photo` is set, hiding its portrait from players who haven't met it yet.
    """
    if character.incognito:
        return None
    return character.profile_photo.path if character.profile_photo else None
