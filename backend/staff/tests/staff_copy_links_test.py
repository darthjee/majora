"""Tests for the staff pending-links view (GET /staff/copies/links.json)."""

from datetime import timedelta

import pytest
from django.contrib.contenttypes.models import ContentType
from django.utils import timezone

from games.models import GameDocumentFile, GameItemPhoto, GamePhoto
from games.tests.factories import GameDocumentFactory, GameFactory
from staff import photo_types
from staff.tests.copy_test_support import StaffCopyActorsMixin, StaffCopyGateBehavior
from staff.tests.photo_builders import PhotoBuilder
from uploads.models import Upload

URL = '/staff/copies/links.json'

PHOTO_SLUGS = [
    'game_item', 'game_common_item', 'game_faction', 'game_possession', 'game_document',
    'game_document_file',
]


class CopyLinksSupport(StaffCopyActorsMixin):
    """Shared actors, games and helpers for the pending-links tests."""

    def setup_links(self):
        """Create the actors, a target game, another game and their photo builders."""
        self.setup_actors()
        self.game = GameFactory(name='Target', game_slug='target')
        self.other_game = GameFactory(name='Other', game_slug='other')
        self.builder = PhotoBuilder(game=self.game)

    def send(self, client, token=None):
        """Issue a GET on the target game's links."""
        return self.get_json(client, f'{URL}?to=target', token)

    def send_wrong_method(self, client, token=None):
        """Issue a POST on the links list."""
        return self.post_json(client, f'{URL}?to=target', {}, token)

    def copy_upload(self, row, **kwargs):
        """Create a copy-origin upload linking `row`."""
        kwargs.setdefault('origin', Upload.ORIGIN_COPY)
        return Upload.objects.create(
            user=self.staff_user, content_object=row, file_path='photos/t/copy.png',
            source_path='photos/s/source.png', **kwargs,
        )

    def links(self, client, slug='target'):
        """Return the decoded links list of `slug` as staff."""
        response = self.get_json(client, f'{URL}?to={slug}', self.staff_token)
        assert response.status_code == 200
        return response.json()

    def upload_ids(self, client):
        """Return the listed upload ids of the target game."""
        return [link['upload_id'] for link in self.links(client)]


@pytest.mark.django_db
class TestStaffCopyLinksGate(CopyLinksSupport, StaffCopyGateBehavior):
    """Tests for the staff gate and the `to` parameter."""

    def setup_method(self):
        """Set up the actors and games."""
        self.setup_links()

    def test_staff_gets_200_with_skip_cache(self, client):
        """Test that a staff user gets 200 with X-Skip-Cache."""
        response = self.send(client, self.staff_token)
        assert response.status_code == 200
        assert response['X-Skip-Cache'] == 'true'

    def test_superuser_returns_200(self, client):
        """Test that a superuser can read the links list."""
        assert self.send(client, self.superuser_token).status_code == 200

    def test_unauthenticated_with_unknown_slug_returns_401(self, client):
        """Test that the gate runs before slug resolution for anonymous callers."""
        assert self.get_json(client, f'{URL}?to=nope').status_code == 401

    def test_regular_user_with_unknown_slug_returns_403(self, client):
        """Test that the gate runs before slug resolution for regular users."""
        response = self.get_json(client, f'{URL}?to=nope', self.regular_token)
        assert response.status_code == 403

    def test_missing_to_returns_400(self, client):
        """Test that a missing `to` returns 400 required."""
        response = self.get_json(client, URL, self.staff_token)
        assert response.status_code == 400
        assert response.json() == {'errors': {'to': ['required']}}

    def test_unknown_to_returns_400(self, client):
        """Test that an unknown `to` returns 400 not_found."""
        response = self.get_json(client, f'{URL}?to=nope', self.staff_token)
        assert response.status_code == 400
        assert response.json() == {'errors': {'to': ['not_found']}}

    def test_empty_game_returns_empty_list(self, client):
        """Test that a game without copy uploads returns an empty list."""
        assert self.links(client) == []


@pytest.mark.django_db
class TestStaffCopyLinksSelection(CopyLinksSupport):
    """Tests for which uploads are listed."""

    def setup_method(self):
        """Set up the actors, games and a copied item photo of the target game."""
        self.setup_links()
        self.photo, _ = self.builder.build('game_item')

    @pytest.mark.parametrize('status', [
        Upload.STATUS_PENDING, Upload.STATUS_UPLOADING, Upload.STATUS_FAILED,
    ])
    def test_not_uploaded_statuses_are_listed(self, client, status):
        """Test that pending, uploading and failed copy uploads are listed."""
        upload = self.copy_upload(self.photo, status=status)
        assert self.upload_ids(client) == [upload.pk]

    def test_expired_upload_is_listed(self, client):
        """Test that an expired copy upload is listed."""
        upload = self.copy_upload(
            self.photo, expiration_time=timezone.now() - timedelta(minutes=1)
        )
        assert self.upload_ids(client) == [upload.pk]

    def test_failed_upload_exposes_its_error(self, client):
        """Test that a failed link carries its status and error."""
        self.copy_upload(self.photo, status=Upload.STATUS_FAILED, error='cross_device')
        link = self.links(client)[0]
        assert (link['status'], link['error']) == ('failed', 'cross_device')

    def test_uploaded_upload_is_excluded(self, client):
        """Test that an uploaded copy upload is not listed."""
        self.copy_upload(self.photo, status=Upload.STATUS_UPLOADED)
        assert self.links(client) == []

    @pytest.mark.parametrize('origin', [Upload.ORIGIN_REGULAR, Upload.ORIGIN_STAFF])
    def test_non_copy_uploads_are_excluded(self, client, origin):
        """Test that regular and staff uploads are not listed."""
        self.copy_upload(self.photo, origin=origin)
        assert self.links(client) == []

    def test_other_games_uploads_are_excluded(self, client):
        """Test that the copy uploads of another game are not listed."""
        other_photo, _ = PhotoBuilder(game=self.other_game).build('game_item')
        upload = self.copy_upload(other_photo)
        assert self.links(client) == []
        assert [link['upload_id'] for link in self.links(client, 'other')] == [upload.pk]

    def test_orphaned_upload_is_excluded(self, client):
        """Test that a copy upload whose row no longer exists is not listed."""
        Upload.objects.create(
            user=self.staff_user, origin=Upload.ORIGIN_COPY, file_path='photos/x.png',
            content_type=ContentType.objects.get_for_model(GameItemPhoto),
            object_id=self.photo.pk + 1000,
        )
        assert self.links(client) == []

    def test_detached_document_file_photo_is_excluded(self, client):
        """Test that a file photo no longer pointed at by any file is not listed."""
        photo, document_file = self.builder.build('game_document_file')
        self.copy_upload(photo)
        document_file.delete()
        assert self.links(client) == []

    def test_unregistered_model_upload_is_excluded(self, client):
        """Test that a copy upload of a non-copyable model is not listed."""
        self.copy_upload(GamePhoto.objects.create(game=self.game, path='photos/g.png'))
        assert self.links(client) == []

    def test_links_are_ordered_by_upload_id(self, client):
        """Test that links are listed in upload id order."""
        other, _ = self.builder.build('game_document')
        first = self.copy_upload(other)
        second = self.copy_upload(self.photo)
        assert self.upload_ids(client) == [first.pk, second.pk]


@pytest.mark.django_db
class TestStaffCopyLinksPayload(CopyLinksSupport):
    """Tests for the shape of each listed link."""

    def setup_method(self):
        """Set up the actors and games."""
        self.setup_links()

    @pytest.mark.parametrize('slug', PHOTO_SLUGS)
    def test_photo_link_describes_copied_entity(self, client, slug):
        """Test that each copyable photo type is listed with its owner as entity."""
        photo, owner = self.builder.build(slug)
        upload = self.copy_upload(photo)
        assert self.links(client) == [{
            'upload_id': upload.pk,
            'upload_type': 'image',
            'status': 'pending',
            'error': None,
            'entity': photo_types.find(slug).describe_owner(owner),
        }]

    def test_document_file_link_describes_the_file(self, client):
        """Test that a document file is listed with itself as entity."""
        document = GameDocumentFactory(game=self.game, name='Letters')
        document_file = GameDocumentFile.objects.create(
            game_document=document, name='letter.pdf', path='files/letter.pdf'
        )
        self.copy_upload(document_file, upload_type=Upload.UPLOAD_TYPE_FILE)
        link = self.links(client)[0]
        assert link['upload_type'] == 'file'
        assert link['entity'] == {
            'type': 'game_document_file', 'id': document_file.pk, 'name': 'letter.pdf',
            'kind': None, 'game': {'slug': 'target', 'name': 'Target'},
        }

    def test_link_never_exposes_paths_token_or_user(self, client):
        """Test that the payload has no path, token or user fields."""
        photo, _ = self.builder.build('game_item')
        self.copy_upload(photo)
        link = self.links(client)[0]
        assert set(link) == {'upload_id', 'upload_type', 'status', 'error', 'entity'}
