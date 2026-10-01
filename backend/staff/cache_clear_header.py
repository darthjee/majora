"""The `X-Cache-Clear` response header telling the proxy which cached paths went stale."""

HEADER = 'X-Cache-Clear'


def attach_cache_clear(response, paths):
    """Set `X-Cache-Clear` on `response` to the comma-separated `paths` (no-op when empty)."""
    if paths:
        response[HEADER] = ', '.join(paths)
    return response


def attach_photo_cache_clear(response, photo_type, owner):
    """Set `X-Cache-Clear` on `response` to the cache paths of a photo type's owner."""
    if photo_type is None:
        return response
    return attach_cache_clear(response, photo_type.cache_paths(owner))
