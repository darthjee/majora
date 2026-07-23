"""Shared storage-path building for photo/upload-init endpoints (issue #813).

Centralizes the sanitization applied to any attacker-influenced string
(game slug, filename stem) before it is embedded in a storage path, and the
UUID-suffixing behavior some endpoints need, replacing the five previously
duplicated `_build_file_path()` implementations.
"""

import os
import re
import unicodedata
import uuid

_INVALID_CHARS_RE = re.compile(r'[&/\\:,\[\]{}()]')
_WHITESPACE_RE = re.compile(r'\s+')


def normalize_path_segment(value):
    """Sanitize `value` so it is safe to embed as a single storage path segment.

    - Transliterates accented/unicode letters to their closest ASCII equivalent
      (e.g. 'é' -> 'e'), dropping other non-ASCII symbols (emoji, etc.).
    - Replaces whitespace (spaces, tabs, line breaks) with '_'.
    - Strips other invalid characters, at minimum: & / \\ : , [ ] ( ) { }.
    """
    ascii_value = unicodedata.normalize('NFKD', value).encode('ascii', 'ignore').decode('ascii')
    underscored = _WHITESPACE_RE.sub('_', ascii_value)
    return _INVALID_CHARS_RE.sub('', underscored)


class PhotoPathBuilder:
    """Builds the storage path for a photo upload from its segments and filename."""

    def __init__(self, segments, filename, use_uuid):
        """Store the path segments before the file component, the filename, and the uuid flag.

        `segments` are the path parts before the final file component (e.g.
        `['games', game_slug, 'characters', character_id]`); each is normalized via
        `normalize_path_segment` (non-string segments, e.g. numeric ids, are coerced
        to `str` first). `filename` is expected to already be a sanitised basename
        (no directory components) as produced by `PhotoUploadSerializer.validate_filename`.
        When `use_uuid` is True, a `uuid.uuid4()` is appended to the (normalized)
        filename stem; otherwise the normalized stem is used as-is.
        """
        self._segments = segments
        self._filename = filename
        self._use_uuid = use_uuid

    def build(self):
        """Return the fully-built, normalized storage path."""
        normalized_segments = [normalize_path_segment(str(segment)) for segment in self._segments]
        stem, ext = os.path.splitext(self._filename)
        normalized_stem = normalize_path_segment(stem)
        if self._use_uuid:
            normalized_stem = f'{normalized_stem}_{uuid.uuid4()}'
        path_parts = ['photos', *normalized_segments, f'{normalized_stem}{ext}']
        return '/'.join(path_parts)
