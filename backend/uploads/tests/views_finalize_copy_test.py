"""Tests for the upload finalize endpoint's copy branch (`Upload.origin == 'copy'`)."""

import json
from datetime import timedelta

import pytest
from django.utils import timezone
from rest_framework.authtoken.models import Token

from games.models import (
    GameCommonItemPhoto,
    GameDocumentFile,
    GameFactionPhoto,
    GameItemPhoto,
)
from games.tests.factories import (
    CharacterFactory,
    GameCommonItemFactory,
    GameDocumentFactory,
    GameFactionFactory,
    GameFactory,
    GameItemFactory,
    PlayerFactory,
    SuperUserFactory,
    UserFactory,
)
from staff import copy_links
from uploads.models import Upload


class CopyFinalizeSupport:
    """Shared actors and request helpers for the copy finalize tests."""

    def setup_actors(self):
        """Create a game, a staff user, a superuser and a game DM (non-staff)."""
        self.game = GameFactory(name='Target Game')
        self.staff_user = UserFactory(username='staffer', is_staff=True)
        self.staff_token = Token.objects.create(user=self.staff_user)
        self.superuser = SuperUserFactory(username='admin')
        self.superuser_token = Token.objects.create(user=self.superuser)
        self.dm_user = UserFactory(username='dm_user')
        PlayerFactory(game=self.game, user=self.dm_user, is_dm=True)
        self.dm_token = Token.objects.create(user=self.dm_user)

    def copy_upload(self, row, user=None, upload_type=Upload.UPLOAD_TYPE_IMAGE, **kwargs):
        """Create a copy-origin upload linking `row`."""
        return Upload.objects.create(
            user=user or self.staff_user, content_object=row, origin=Upload.ORIGIN_COPY,
            upload_type=upload_type, file_path='photos/games/target/copy.png',
            source_path='photos/games/source/original.png', **kwargs,
        )

    def patch(self, client, upload, payload, token=None, upload_type=None, upload_token=None):
        """Issue a finalize PATCH for `upload` with `payload`."""
        token = token or self.staff_token
        return client.patch(
            f'/uploads/{upload_type or upload.upload_type}/{upload.pk}.json',
            data=json.dumps(payload),
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Token {token.key}',
            HTTP_X_UPLOAD_TOKEN=upload_token or upload.token,
        )

    def finalize(self, client, upload, **kwargs):
        """Advance `upload` to uploading then uploaded, returning the last response."""
        self.patch(client, upload, {'status': 'uploading'}, **kwargs)
        return self.patch(client, upload, {'status': 'uploaded'}, **kwargs)


@pytest.mark.django_db
class TestCopyFinalizeLinkFlow(CopyFinalizeSupport):
    """Tests for the start and finalize transitions of a copy upload."""

    def setup_method(self):
        """Create the actors and a not-ready copied item photo."""
        self.setup_actors()
        self.item = GameItemFactory(game=self.game, name='Sword')
        self.photo = GameItemPhoto.objects.create(
            game_item=self.item, path='photos/games/target/copy.png', ready=False
        )

    def test_start_returns_both_paths(self, client):
        """Test that uploading returns `file_path` and `source_path`."""
        upload = self.copy_upload(self.photo)
        response = self.patch(client, upload, {'status': 'uploading'})
        assert response.status_code == 200
        assert response.json() == {
            'file_path': 'photos/games/target/copy.png',
            'source_path': 'photos/games/source/original.png',
        }
        assert response['X-Skip-Cache'] == 'true'

    def test_uploaded_marks_row_ready(self, client):
        """Test that uploaded sets `ready` on the copied row."""
        upload = self.copy_upload(self.photo)
        response = self.finalize(client, upload)
        assert response.status_code == 200
        self.photo.refresh_from_db()
        assert self.photo.ready is True
        upload.refresh_from_db()
        assert upload.status == Upload.STATUS_UPLOADED

    def test_uploaded_with_deleted_row_returns_404_and_keeps_status(self, client, monkeypatch):
        """Test that a vanished copied row returns 404 without marking the upload uploaded."""
        upload = self.copy_upload(self.photo, status=Upload.STATUS_UPLOADING)
        monkeypatch.setattr(
            'uploads.copy_link_finalizer.CopyLinkFinalizer._locked_row', lambda self: None
        )
        response = self.patch(client, upload, {'status': 'uploaded'})
        assert response.status_code == 404
        upload.refresh_from_db()
        assert upload.status == Upload.STATUS_UPLOADING

    def test_uploaded_sets_cover_when_is_cover(self, client):
        """Test that a cover copy points the owner's `photo` FK at the row."""
        upload = self.copy_upload(self.photo, is_cover=True)
        self.finalize(client, upload)
        self.item.refresh_from_db()
        assert self.item.photo_id == self.photo.pk

    def test_uploaded_skips_per_type_handlers(self, client):
        """Test that a non-cover copy leaves the owner's `photo` unchanged."""
        upload = self.copy_upload(self.photo)
        self.finalize(client, upload)
        self.item.refresh_from_db()
        assert self.item.photo_id is None

    def test_uploaded_has_no_cache_clear_by_default(self, client):
        """Test that an entry without a hook sends no `X-Cache-Clear`."""
        faction = GameFactionFactory(game=self.game)
        photo = GameFactionPhoto.objects.create(
            faction=faction, path='photos/games/target/copy.png', ready=False
        )
        response = self.finalize(client, self.copy_upload(photo))
        assert not response.has_header('X-Cache-Clear')

    def test_uploaded_common_item_cover_sets_photo_and_sends_family_cache_clear(self, client):
        """Test that a common item cover finalize sets its photo and clears its family only."""
        CharacterFactory(game=self.game, npc=True)
        common_item = GameCommonItemFactory(game=self.game)
        photo = GameCommonItemPhoto.objects.create(
            game_common_item=common_item, path='photos/games/target/copy.png', ready=False
        )
        response = self.finalize(client, self.copy_upload(photo, is_cover=True))
        common_item.refresh_from_db()
        assert common_item.photo_id == photo.pk
        slug, pk = self.game.game_slug, common_item.pk
        assert response['X-Cache-Clear'] == ', '.join([
            f'/games/{slug}/common_items.json', f'/games/{slug}/common_items/all.json',
            f'/games/{slug}/common_items/{pk}.json', f'/games/{slug}/common_items/{pk}/full.json',
        ])

    def test_uploaded_item_cover_sends_item_copy_cache_clear(self, client):
        """Test that an item cover finalize clears the item family and available lists."""
        npc = CharacterFactory(game=self.game, npc=True)
        upload = self.copy_upload(self.photo, is_cover=True)
        response = self.finalize(client, upload)
        slug, item_id = self.game.game_slug, self.item.pk
        assert response['X-Cache-Clear'] == ', '.join([
            f'/games/{slug}/items.json', f'/games/{slug}/items/all.json',
            f'/games/{slug}/items/{item_id}.json', f'/games/{slug}/items/{item_id}/full.json',
            f'/games/{slug}/npcs/{npc.pk}/items/available.json',
        ])

    def test_uploaded_sends_cache_clear_from_hook(self, client, monkeypatch):
        """Test that `X-Cache-Clear` lists the paths returned by the registered hook."""
        entry = copy_links.find_for_model(GameItemPhoto)
        monkeypatch.setattr(
            entry, '_cache_paths', lambda row, upload: ['/a.json', f'/items/{row.pk}.json']
        )
        upload = self.copy_upload(self.photo)
        response = self.finalize(client, upload)
        assert response['X-Cache-Clear'] == f'/a.json, /items/{self.photo.pk}.json'

    def test_uploading_has_no_cache_clear(self, client, monkeypatch):
        """Test that the start step never sends `X-Cache-Clear`."""
        entry = copy_links.find_for_model(GameItemPhoto)
        monkeypatch.setattr(entry, '_cache_paths', lambda row, upload: ['/a.json'])
        upload = self.copy_upload(self.photo)
        response = self.patch(client, upload, {'status': 'uploading'})
        assert not response.has_header('X-Cache-Clear')

    def test_document_file_copy_is_finalized(self, client):
        """Test that a `file` copy upload of a document file marks it ready."""
        document_file = GameDocumentFile.objects.create(
            game_document=GameDocumentFactory(game=self.game), path='files/copy.pdf'
        )
        upload = self.copy_upload(
            document_file, upload_type=Upload.UPLOAD_TYPE_FILE, is_cover=True
        )
        response = self.finalize(client, upload)
        assert response.status_code == 200
        document_file.refresh_from_db()
        assert document_file.ready is True
        assert document_file.photo_id is None

    def test_regular_upload_still_returns_only_file_path(self, client):
        """Test that a regular upload's start keeps returning only `file_path`."""
        upload = Upload.objects.create(
            user=self.dm_user, content_object=self.photo, file_path='photos/regular.png'
        )
        response = self.patch(client, upload, {'status': 'uploading'}, token=self.dm_token)
        assert response.json() == {'file_path': 'photos/regular.png'}


@pytest.mark.django_db
class TestCopyFinalizeFailure(CopyFinalizeSupport):
    """Tests for the `failed` transition."""

    def setup_method(self):
        """Create the actors and a copied item photo."""
        self.setup_actors()
        item = GameItemFactory(game=self.game, name='Sword')
        self.photo = GameItemPhoto.objects.create(game_item=item, path='p.png', ready=False)

    @pytest.mark.parametrize('from_status', [Upload.STATUS_PENDING, Upload.STATUS_UPLOADING])
    def test_failed_with_valid_error_is_recorded(self, client, from_status):
        """Test that `failed` + a valid error is accepted from pending and uploading."""
        upload = self.copy_upload(self.photo, status=from_status)
        response = self.patch(client, upload, {'status': 'failed', 'error': 'cross_device'})
        assert response.status_code == 200
        upload.refresh_from_db()
        assert (upload.status, upload.error) == (Upload.STATUS_FAILED, 'cross_device')
        self.photo.refresh_from_db()
        assert self.photo.ready is False

    @pytest.mark.parametrize('payload', [
        {'status': 'failed'},
        {'status': 'failed', 'error': 'exploded'},
        {'status': 'failed', 'error': None},
        {'status': 'failed', 'error': []},
        {'status': 'failed', 'error': {}},
    ])
    def test_failed_without_valid_error_returns_400(self, client, payload):
        """Test that a missing or unknown error returns 400 and leaves the upload unchanged."""
        upload = self.copy_upload(self.photo)
        response = self.patch(client, upload, payload)
        assert response.status_code == 400
        assert response.json() == {'errors': {'error': ['invalid_error']}}
        upload.refresh_from_db()
        assert (upload.status, upload.error) == (Upload.STATUS_PENDING, None)

    def test_failed_on_regular_upload_returns_400(self, client):
        """Test that a regular upload refuses `failed` as an invalid status."""
        upload = Upload.objects.create(
            user=self.dm_user, content_object=self.photo, file_path='photos/regular.png'
        )
        response = self.patch(
            client, upload, {'status': 'failed', 'error': 'unknown'}, token=self.dm_token
        )
        assert response.status_code == 400
        assert response.json() == {'errors': {'status': ['invalid_status']}}

    @pytest.mark.parametrize('new_status', [[], {}, ['failed'], {'status': 'failed'}])
    def test_non_string_status_on_copy_upload_returns_400(self, client, new_status):
        """Test that a non-string status on a copy upload returns 400 invalid_status."""
        upload = self.copy_upload(self.photo)
        response = self.patch(client, upload, {'status': new_status, 'error': 'unknown'})
        assert response.status_code == 400
        assert response.json() == {'errors': {'status': ['invalid_status']}}
        upload.refresh_from_db()
        assert upload.status == Upload.STATUS_PENDING

    @pytest.mark.parametrize('new_status', [[], {}, ['uploading'], {'status': 'uploading'}])
    def test_non_string_status_on_regular_upload_returns_400(self, client, new_status):
        """Test that a non-string status on a regular upload returns 400 invalid_status."""
        upload = Upload.objects.create(
            user=self.dm_user, content_object=self.photo, file_path='photos/regular.png'
        )
        response = self.patch(client, upload, {'status': new_status}, token=self.dm_token)
        assert response.status_code == 400
        assert response.json() == {'errors': {'status': ['invalid_status']}}
        upload.refresh_from_db()
        assert upload.status == Upload.STATUS_PENDING

    def test_failed_on_staff_upload_returns_400(self, client):
        """Test that a staff-origin upload refuses `failed` as an invalid status."""
        upload = Upload.objects.create(
            user=self.staff_user, content_object=self.photo, file_path='photos/staff.png',
            origin=Upload.ORIGIN_STAFF,
        )
        response = self.patch(client, upload, {'status': 'failed', 'error': 'unknown'})
        assert response.status_code == 400

    @pytest.mark.parametrize('payload', [
        {'status': 'uploading'},
        {'status': 'uploaded'},
        {'status': 'failed', 'error': 'unknown'},
    ])
    def test_patch_on_failed_upload_returns_403(self, client, payload):
        """Test that a failed upload accepts no further PATCH."""
        upload = self.copy_upload(self.photo, status=Upload.STATUS_FAILED, error='unknown')
        response = self.patch(client, upload, payload)
        assert response.status_code == 403
        assert response.content == b''


@pytest.mark.django_db
class TestCopyFinalizeAccess(CopyFinalizeSupport):
    """Tests for the staff gate and the no-leak ordering of copy uploads."""

    def setup_method(self):
        """Create the actors and a copied item photo."""
        self.setup_actors()
        item = GameItemFactory(game=self.game, name='Sword')
        self.photo = GameItemPhoto.objects.create(game_item=item, path='p.png', ready=False)

    def test_non_staff_owner_gets_403(self, client):
        """Test that a non-staff game DM owning the upload is refused."""
        upload = self.copy_upload(self.photo, user=self.dm_user)
        response = self.patch(client, upload, {'status': 'uploading'}, token=self.dm_token)
        assert response.status_code == 403
        upload.refresh_from_db()
        assert upload.status == Upload.STATUS_PENDING

    def test_staff_non_editor_succeeds(self, client):
        """Test that a staff member who is not a game editor may finalize."""
        upload = self.copy_upload(self.photo)
        response = self.finalize(client, upload)
        assert response.status_code == 200

    def test_superuser_succeeds(self, client):
        """Test that a superuser may finalize a copy upload."""
        upload = self.copy_upload(self.photo, user=self.superuser)
        response = self.finalize(client, upload, token=self.superuser_token)
        assert response.status_code == 200

    def test_non_staff_wrong_upload_type_gets_403_not_404(self, client):
        """Test that the staff check runs before the upload_type 404."""
        upload = self.copy_upload(self.photo, user=self.dm_user)
        response = self.patch(
            client, upload, {'status': 'uploading'}, token=self.dm_token, upload_type='file'
        )
        assert response.status_code == 403

    def test_staff_wrong_upload_type_gets_404(self, client):
        """Test that an authorized caller with the wrong upload_type gets 404."""
        upload = self.copy_upload(self.photo)
        response = self.patch(client, upload, {'status': 'uploading'}, upload_type='file')
        assert response.status_code == 404

    def test_wrong_token_gets_403(self, client):
        """Test that a wrong upload token is refused."""
        upload = self.copy_upload(self.photo)
        response = self.patch(client, upload, {'status': 'uploading'}, upload_token='nope')
        assert response.status_code == 403

    def test_other_staff_user_gets_403(self, client):
        """Test that a staff member who does not own the upload is refused."""
        upload = self.copy_upload(self.photo, user=self.superuser)
        response = self.patch(client, upload, {'status': 'uploading'})
        assert response.status_code == 403

    def test_expired_upload_gets_403(self, client):
        """Test that an expired copy upload is refused."""
        upload = self.copy_upload(
            self.photo, expiration_time=timezone.now() - timedelta(minutes=1)
        )
        response = self.patch(client, upload, {'status': 'uploading'})
        assert response.status_code == 403

    def test_uploaded_upload_gets_403(self, client):
        """Test that an already uploaded copy upload is refused."""
        upload = self.copy_upload(self.photo, status=Upload.STATUS_UPLOADED)
        response = self.patch(client, upload, {'status': 'uploaded'})
        assert response.status_code == 403
