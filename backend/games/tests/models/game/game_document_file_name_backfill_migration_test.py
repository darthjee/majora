"""Tests for the 0076 data migration backfilling GameDocumentFile.name from its path."""

import importlib

import pytest
from django.apps import apps
from django.test import TestCase

_migration = importlib.import_module(
    'games.migrations.0076_backfill_gamedocumentfile_name',
)


class TestGameDocumentFileNameBackfillNoopReverse(TestCase):
    """Tests for the 0076 migration's reverse operation."""

    def test_reverse_migration_is_a_noop(self):
        """Test that the reverse migration runs without raising and touches nothing."""
        _migration._noop_reverse(apps, None)


@pytest.mark.parametrize(
    'path,expected_name',
    [
        (
            'files/games/epic-quest/documents/1/scroll_'
            '123e4567-e89b-12d3-a456-426614174000.pdf',
            'scroll.pdf',
        ),
        (
            'files/games/epic-quest/documents/1/my_scroll_v2_'
            '123e4567-e89b-12d3-a456-426614174000.pdf',
            'my_scroll_v2.pdf',
        ),
        ('', ''),
        (
            'files/games/epic-quest/documents/1/'
            'ABCDEF01-ABCD-ABCD-ABCD-ABCDEF012345_notes.pdf',
            'ABCDEF01-ABCD-ABCD-ABCD-ABCDEF012345_notes.pdf',
        ),
    ],
)
def test_extract_name_from_path(path, expected_name):
    """Test that the backfill regex extracts the original file name from representative paths."""
    assert _migration._extract_name_from_path(path) == expected_name
