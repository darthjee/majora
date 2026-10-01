"""Shared helpers for the staff single-photo views (replace, deletable, delete)."""

from rest_framework.response import Response

from .. import photo_types


def find_staff_photo(photo_type, photo_id):
    """Return `(entry, photo, None)`, or `(None, None, 404 Response)` if either is unknown.

    Each registry entry only looks up its own model, so the id of another type's photo is 404.
    """
    entry = photo_types.find(photo_type)
    if entry is None:
        return None, None, Response(status=404)
    photo = entry.find_photo(photo_id)
    if photo is None:
        return None, None, Response(status=404)
    return entry, photo, None
