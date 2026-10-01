"""Tests for the staff photos list view (GET /staff/photos/<photo_type>.json)."""

from datetime import timedelta

import pytest
from django.db import connection
from django.test.utils import CaptureQueriesContext
from django.utils import timezone

from games.tests.factories import CharacterFactory, TreasureFactory
from staff import photo_types
from staff.tests.photo_test_support import StaffPhotoActorsMixin
from uploads.models import Upload

SLUGS = photo_types.slugs()


def _url(slug):
    """Return the list URL of the given photo type."""
    return f'/staff/photos/{slug}.json'


@pytest.mark.django_db
class TestStaffPhotosListView(StaffPhotoActorsMixin):
    """Tests for the GET /staff/photos/<photo_type>.json endpoint, over every photo type."""

    def setup_method(self):
        """Set up staff, superuser and regular users."""
        self.setup_actors()

    def _upload_for(self, photo, **kwargs):
        """Create an upload linked to `photo`."""
        return Upload.objects.create(
            user=self.staff_user, file_path=photo.path, content_object=photo, **kwargs
        )

    @pytest.mark.parametrize('slug', SLUGS + ['unknown'])
    def test_unauthenticated_returns_401(self, client, slug):
        """Test that an unauthenticated request returns 401, even for an unknown slug."""
        response = self.get_json(client, _url(slug))
        assert response.status_code == 401
        assert response['X-Skip-Cache'] == 'true'

    @pytest.mark.parametrize('slug', SLUGS + ['unknown'])
    def test_non_staff_returns_403(self, client, slug):
        """Test that a regular user gets 403, even for an unknown slug."""
        assert self.get_json(client, _url(slug), self.regular_token).status_code == 403

    def test_unknown_slug_returns_404(self, client):
        """Test that an unknown photo type returns 404 for staff."""
        response = self.get_json(client, _url('unknown'), self.staff_token)
        assert response.status_code == 404
        assert response['X-Skip-Cache'] == 'true'

    @pytest.mark.parametrize('slug', SLUGS)
    def test_item_shape(self, client, slug):
        """Test that each item carries id, path, ready, replace_in_progress and owner."""
        photo, owner = self.builder.build(slug, path='photos/a/photo.png')
        response = self.get_json(client, _url(slug), self.staff_token)
        assert response.status_code == 200
        assert response['X-Skip-Cache'] == 'true'
        item = response.json()[0]
        assert item['id'] == photo.pk
        assert item['path'] == 'photos/a/photo.png'
        assert item['ready'] is True
        assert item['replace_in_progress'] is False
        assert item['owner']['type'] == slug
        assert item['owner']['id'] == owner.pk

    @pytest.mark.parametrize('slug', SLUGS)
    def test_newest_first_including_not_ready(self, client, slug):
        """Test that every row, ready or not, is listed newest first."""
        older, owner = self.builder.build(slug, ready=True)
        newer, _ = self.builder.build(slug, ready=False)
        response = self.get_json(client, _url(slug), self.superuser_token)
        assert [item['id'] for item in response.json()] == [newer.pk, older.pk]

    @pytest.mark.parametrize('slug', SLUGS)
    def test_pagination_headers(self, client, slug):
        """Test that pagination is reported in headers."""
        self.builder.build(slug)
        self.builder.build(slug)
        response = self.get_json(client, f'{_url(slug)}?per_page=1', self.staff_token)
        assert len(response.json()) == 1
        assert response['page'] == '1'
        assert response['pages'] == '2'
        assert response['per_page'] == '1'
        assert response['total'] == '2'

    @pytest.mark.parametrize('slug', SLUGS)
    def test_replace_in_progress_with_active_upload(self, client, slug):
        """Test that replace_in_progress is true while an active upload exists."""
        photo, _ = self.builder.build(slug)
        self._upload_for(photo, status=Upload.STATUS_UPLOADING)
        response = self.get_json(client, _url(slug), self.staff_token)
        assert response.json()[0]['replace_in_progress'] is True

    def test_replace_not_in_progress_with_expired_upload(self, client):
        """Test that an expired upload does not mark the photo as in progress."""
        photo, _ = self.builder.build('game')
        self._upload_for(photo, expiration_time=timezone.now() - timedelta(minutes=1))
        response = self.get_json(client, _url('game'), self.staff_token)
        assert response.json()[0]['replace_in_progress'] is False

    def test_replace_not_in_progress_with_uploaded_upload(self, client):
        """Test that a finished upload does not mark the photo as in progress."""
        photo, _ = self.builder.build('game')
        self._upload_for(photo, status=Upload.STATUS_UPLOADED)
        response = self.get_json(client, _url('game'), self.staff_token)
        assert response.json()[0]['replace_in_progress'] is False

    def test_owner_description(self, client):
        """Test the full owner description of a game-scoped photo."""
        self.builder.build('game_faction')
        response = self.get_json(client, _url('game_faction'), self.staff_token)
        game = self.builder.game
        assert response.json()[0]['owner'] == {
            'type': 'game_faction',
            'id': response.json()[0]['owner']['id'],
            'name': 'Red Hand',
            'kind': None,
            'game': {'slug': game.game_slug, 'name': game.name},
        }

    def test_orphan_document_file_photo_has_null_owner(self, client):
        """Test that a GameDocumentFilePhoto with no owning file lists owner null."""
        photo_types.find('game_document_file').model.objects.create(path='photos/o.png')
        response = self.get_json(client, _url('game_document_file'), self.staff_token)
        assert response.json()[0]['owner'] is None

    def test_global_treasure_has_null_game(self, client):
        """Test that a treasure with no game lists owner.game null."""
        self.builder.build('treasure', owner=TreasureFactory(name='Crown'))
        response = self.get_json(client, _url('treasure'), self.staff_token)
        assert response.json()[0]['owner']['game'] is None

    def test_pc_and_npc_kind(self, client):
        """Test that characters are listed with their pc/npc kind."""
        pc = CharacterFactory(game=self.builder.game, npc=False, name='Sam')
        self.builder.build('character', owner=pc)
        self.builder.build('character')
        response = self.get_json(client, _url('character'), self.staff_token)
        assert [item['owner']['kind'] for item in response.json()] == ['npc', 'pc']


@pytest.mark.django_db
class TestStaffPhotosListQueryBudget(StaffPhotoActorsMixin):
    """Tests that the list endpoint runs a constant number of queries per page."""

    def setup_method(self):
        """Set up staff, superuser and regular users."""
        self.setup_actors()

    def _count_queries(self, client, slug):
        """Return the number of queries one list request runs."""
        with CaptureQueriesContext(connection) as context:
            self.get_json(client, _url(slug), self.staff_token)
        return len(context.captured_queries)

    @pytest.mark.parametrize('slug', ['game_faction', 'character_item', 'game_document_file'])
    def test_query_count_is_independent_of_rows(self, client, slug, django_assert_num_queries):
        """Test that adding rows does not add queries."""
        self.builder.build(slug)
        self.get_json(client, _url(slug), self.staff_token)
        expected = self._count_queries(client, slug)
        for _ in range(4):
            self.builder.build(slug)
        with django_assert_num_queries(expected):
            self.get_json(client, _url(slug), self.staff_token)
