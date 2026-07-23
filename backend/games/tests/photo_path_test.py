"""Tests for normalize_path_segment and PhotoPathBuilder."""

import pytest

from games.photo_path import PhotoPathBuilder, normalize_path_segment


class TestNormalizePathSegment:
    """Tests for normalize_path_segment()."""

    def test_replaces_spaces_with_underscore(self):
        """Test that spaces are replaced with underscores."""
        assert normalize_path_segment('my photo') == 'my_photo'

    def test_replaces_line_breaks_with_underscore(self):
        """Test that line breaks are replaced with underscores."""
        assert normalize_path_segment('my\nphoto') == 'my_photo'

    def test_replaces_tabs_with_underscore(self):
        """Test that tabs are replaced with underscores."""
        assert normalize_path_segment('my\tphoto') == 'my_photo'

    def test_collapses_consecutive_whitespace_into_single_underscore(self):
        """Test that runs of whitespace collapse to a single underscore."""
        assert normalize_path_segment('my   photo') == 'my_photo'

    def test_transliterates_accented_letters_to_ascii(self):
        """Test that accented/unicode letters are transliterated to their ASCII equivalent."""
        assert normalize_path_segment('héroe') == 'heroe'

    def test_strips_emoji_and_other_non_ascii_symbols(self):
        """Test that emoji and other non-ASCII symbols with no ASCII equivalent are dropped."""
        assert normalize_path_segment('photo😀') == 'photo'

    @pytest.mark.parametrize('char', ['&', '/', '\\', ':', ',', '[', ']', '(', ')', '{', '}'])
    def test_removes_invalid_characters(self, char):
        """Test that each listed invalid character is removed."""
        assert normalize_path_segment(f'a{char}b') == 'ab'

    def test_leaves_already_clean_value_unchanged(self):
        """Test that a value with no unsafe characters is returned unchanged."""
        assert normalize_path_segment('epic-quest_1') == 'epic-quest_1'


class TestPhotoPathBuilder:
    """Tests for PhotoPathBuilder.build()."""

    def test_builds_path_with_normalized_segments_and_stem(self):
        """Test that segments and the filename stem are normalized in the resulting path."""
        builder = PhotoPathBuilder(['games', 'épic quest'], 'my photo.png', use_uuid=False)
        assert builder.build() == 'photos/games/epic_quest/my_photo.png'

    def test_preserves_the_dot_between_stem_and_extension(self):
        """Test that the '.' separating stem from extension is preserved as-is."""
        builder = PhotoPathBuilder(['treasures', 1], 'photo.jpg', use_uuid=False)
        assert builder.build() == 'photos/treasures/1/photo.jpg'

    def test_does_not_normalize_the_extension(self):
        """Test that the extension itself is left untouched by normalization."""
        builder = PhotoPathBuilder([], 'file.PNG', use_uuid=False)
        assert builder.build() == 'photos/file.PNG'

    def test_use_uuid_true_appends_a_uuid_suffix_to_the_stem(self):
        """Test that use_uuid=True appends a uuid-suffixed stem, ext preserved."""
        builder = PhotoPathBuilder(['games', 'epic-quest'], 'hero.png', use_uuid=True)
        result = builder.build()
        assert result.startswith('photos/games/epic-quest/hero_')
        assert result.endswith('.png')
        # 'hero_' + uuid4 hex-with-dashes (36 chars) + '.png'
        stem = result.split('/')[-1].rsplit('.', 1)[0]
        uuid_part = stem[len('hero_'):]
        assert len(uuid_part) == 36

    def test_use_uuid_false_keeps_stem_as_is(self):
        """Test that use_uuid=False leaves the normalized stem unchanged, with no suffix."""
        builder = PhotoPathBuilder(['games', 'epic-quest', 'items', 5], 'photo.jpg', use_uuid=False)
        assert builder.build() == 'photos/games/epic-quest/items/5/photo.jpg'

    def test_integer_segments_are_coerced_to_string(self):
        """Test that non-string segments (e.g. numeric ids) are coerced to strings."""
        segments = ['games', 'epic-quest', 'characters', 42]
        builder = PhotoPathBuilder(segments, 'a.png', use_uuid=False)
        assert builder.build() == 'photos/games/epic-quest/characters/42/a.png'
