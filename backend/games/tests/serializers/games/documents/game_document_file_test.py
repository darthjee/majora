"""Tests for the GameDocumentFileSerializer."""

from django.test import TestCase

from games.models import GameDocumentFile, GameDocumentFilePhoto
from games.serializers import GameDocumentFileSerializer
from games.tests.factories import GameDocumentFactory


class TestGameDocumentFileSerializer(TestCase):
    """Tests for the GameDocumentFileSerializer."""

    @classmethod
    def setUpTestData(cls):
        """Set up common test fixtures."""
        cls.document = GameDocumentFactory(name='Ancient Scroll')
        cls.file = GameDocumentFile.objects.create(
            game_document=cls.document, name='Notes', path='files/game_documents/1/notes.pdf',
        )

    def test_serializes_id(self):
        """Test that the id field is serialized."""
        data = GameDocumentFileSerializer(self.file).data
        assert data['id'] == self.file.id

    def test_serializes_name(self):
        """Test that the name field is serialized."""
        data = GameDocumentFileSerializer(self.file).data
        assert data['name'] == 'Notes'

    def test_serializes_path(self):
        """Test that the path field is serialized."""
        data = GameDocumentFileSerializer(self.file).data
        assert data['path'] == 'files/game_documents/1/notes.pdf'

    def test_only_exposes_expected_fields(self):
        """Test that only the documented fields are exposed."""
        data = GameDocumentFileSerializer(self.file).data
        assert set(data.keys()) == {'id', 'name', 'path', 'photo_path'}

    def test_photo_path_is_none_without_photo(self):
        """Test that photo_path is None when the file has no photo."""
        data = GameDocumentFileSerializer(self.file).data
        assert data['photo_path'] is None

    def test_photo_path_reflects_attached_photo(self):
        """Test that photo_path is the photo's path once a GameDocumentFilePhoto is attached."""
        photo = GameDocumentFilePhoto.objects.create(path='photos/game_documents/1/thumb.png')
        self.file.photo = photo
        self.file.save()
        data = GameDocumentFileSerializer(self.file).data
        assert data['photo_path'] == 'photos/game_documents/1/thumb.png'
