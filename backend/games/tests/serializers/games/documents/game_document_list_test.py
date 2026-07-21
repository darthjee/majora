"""Tests for the GameDocumentListSerializer/GameDocumentAllListSerializer."""

from django.test import TestCase

from games.models import GameDocumentPhoto
from games.serializers import GameDocumentAllListSerializer, GameDocumentListSerializer
from games.tests.factories import GameDocumentFactory


class TestGameDocumentListSerializer(TestCase):
    """Tests for the GameDocumentListSerializer."""

    @classmethod
    def setUpTestData(cls):
        """Set up common test fixtures."""
        cls.document = GameDocumentFactory(
            name='Ancient Scroll', description='A crumbling scroll.',
        )

    def test_serializes_id(self):
        """Test that the id field is serialized."""
        data = GameDocumentListSerializer(self.document).data
        assert data['id'] == self.document.id

    def test_serializes_name(self):
        """Test that the name field is serialized."""
        data = GameDocumentListSerializer(self.document).data
        assert data['name'] == 'Ancient Scroll'

    def test_does_not_include_description(self):
        """Test that description is not exposed by the index serializer."""
        data = GameDocumentListSerializer(self.document).data
        assert 'description' not in data

    def test_only_exposes_expected_fields(self):
        """Test that only the documented fields are exposed."""
        data = GameDocumentListSerializer(self.document).data
        assert set(data.keys()) == {'id', 'name', 'photo_path'}

    def test_photo_path_is_none_without_photo(self):
        """Test that photo_path is None when the game document has no photo."""
        data = GameDocumentListSerializer(self.document).data
        assert data['photo_path'] is None

    def test_photo_path_reflects_attached_photo(self):
        """Test that photo_path is the photo's path once a GameDocumentPhoto is attached."""
        photo = GameDocumentPhoto.objects.create(
            game_document=self.document, path='photos/game_documents/1/photo.png',
        )
        self.document.photo = photo
        self.document.save()
        data = GameDocumentListSerializer(self.document).data
        assert data['photo_path'] == 'photos/game_documents/1/photo.png'

    def test_does_not_include_hidden(self):
        """Test that hidden is not exposed by the player-facing serializer."""
        data = GameDocumentListSerializer(self.document).data
        assert 'hidden' not in data


class TestGameDocumentAllListSerializer(TestCase):
    """Tests for the GameDocumentAllListSerializer."""

    @classmethod
    def setUpTestData(cls):
        """Set up common test fixtures."""
        cls.document = GameDocumentFactory(name='Ancient Scroll')

    def test_includes_hidden_field_alongside_list_fields(self):
        """Test that the serializer exposes every GameDocumentListSerializer field plus hidden."""
        data = GameDocumentAllListSerializer(self.document).data
        assert set(data.keys()) == {'id', 'name', 'photo_path', 'hidden'}

    def test_hidden_reflects_the_game_document_own_field(self):
        """Test that hidden reflects the game document's own hidden field."""
        self.document.hidden = True
        self.document.save()
        data = GameDocumentAllListSerializer(self.document).data
        assert data['hidden'] is True
