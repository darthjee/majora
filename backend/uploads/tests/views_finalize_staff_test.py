"""Tests for the upload finalize endpoint's staff branch (`Upload.origin == 'staff'`)."""

import json
from datetime import timedelta

import pytest
from django.utils import timezone
from rest_framework.authtoken.models import Token

from games.tests.factories import PlayerFactory, TreasureFactory, UserFactory
from staff import photo_types
from staff.tests.photo_builders import PhotoBuilder
from uploads.models import Upload

SLUGS = photo_types.slugs()


@pytest.mark.django_db
class TestUploadFinalizeStaffBranch:
    """Tests for PATCH /uploads/image/<id>.json on staff-origin uploads."""

    def setup_method(self):
        """Set up a staff user, another staff user, and the photo builder."""
        self.staff_user = UserFactory(username='staffer', is_staff=True)
        self.staff_token = Token.objects.create(user=self.staff_user)
        self.other_staff = UserFactory(username='other_staffer', is_staff=True)
        self.other_staff_token = Token.objects.create(user=self.other_staff)
        self.builder = PhotoBuilder()

    def _staff_upload(self, photo, file_path, user=None, **kwargs):
        """Create a staff-origin upload replacing `photo` with `file_path`."""
        return Upload.objects.create(
            user=user or self.staff_user, file_path=file_path, content_object=photo,
            origin=Upload.ORIGIN_STAFF, **kwargs,
        )

    def _patch(self, client, upload, status, token=None, upload_token=None):
        """Issue a finalize PATCH for `upload`."""
        token = token or self.staff_token
        return client.patch(
            f'/uploads/image/{upload.pk}.json',
            data=json.dumps({'status': status}),
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Token {token.key}',
            HTTP_X_UPLOAD_TOKEN=upload_token or upload.token,
        )

    def _finalize(self, client, upload, **kwargs):
        """Advance `upload` to uploading then uploaded, returning the last response."""
        self._patch(client, upload, 'uploading', **kwargs)
        return self._patch(client, upload, 'uploaded', **kwargs)

    @pytest.mark.parametrize('slug', SLUGS)
    def test_same_path_returns_200_without_body(self, client, slug):
        """Test that a same-extension replace marks the photo ready with no body."""
        photo, _ = self.builder.build(slug, path='photos/x/p.png', ready=False)
        upload = self._staff_upload(photo, 'photos/x/p.png')
        response = self._finalize(client, upload)
        assert response.status_code == 200
        assert response.content == b''
        assert response['X-Skip-Cache'] == 'true'
        photo.refresh_from_db()
        assert (photo.path, photo.ready) == ('photos/x/p.png', True)

    @pytest.mark.parametrize('slug', SLUGS)
    def test_extension_change_returns_previous_path(self, client, slug):
        """Test that an extension change updates the path and returns previous_path."""
        photo, _ = self.builder.build(slug, path='photos/x/p.png', ready=True)
        upload = self._staff_upload(photo, 'photos/x/p.jpg')
        response = self._finalize(client, upload)
        assert response.status_code == 200
        assert response.json() == {'previous_path': 'photos/x/p.png'}
        assert response['X-Skip-Cache'] == 'true'
        photo.refresh_from_db()
        assert (photo.path, photo.ready) == ('photos/x/p.jpg', True)

    def test_never_ready_photo_still_returns_previous_path(self, client):
        """Test that previous_path is returned even if the photo was never ready."""
        photo, _ = self.builder.build('game', path='photos/x/p.png', ready=False)
        upload = self._staff_upload(photo, 'photos/x/p.webp')
        response = self._finalize(client, upload)
        assert response.json() == {'previous_path': 'photos/x/p.png'}

    def test_uploading_returns_file_path(self, client):
        """Test that pending -> uploading returns the file path and leaves the photo alone."""
        photo, _ = self.builder.build('game', path='photos/x/p.png', ready=True)
        upload = self._staff_upload(photo, 'photos/x/p.jpg')
        response = self._patch(client, upload, 'uploading')
        assert response.status_code == 200
        assert response.json() == {'file_path': 'photos/x/p.jpg'}
        photo.refresh_from_db()
        assert photo.path == 'photos/x/p.png'

    def test_staff_without_game_role_can_finalize(self, client):
        """Test that staff finalizes a photo of a game they have no role in."""
        photo, _ = self.builder.build('game_faction')
        upload = self._staff_upload(photo, photo.path)
        assert self._finalize(client, upload).status_code == 200

    def test_demoted_user_gets_403(self, client):
        """Test that a user no longer staff cannot finalize their staff upload."""
        photo, _ = self.builder.build('game')
        demoted = UserFactory(username='demoted')
        token = Token.objects.create(user=demoted)
        upload = self._staff_upload(photo, photo.path, user=demoted)
        assert self._patch(client, upload, 'uploading', token=token).status_code == 403

    def test_dm_without_staff_gets_403(self, client):
        """Test that the game's DM cannot finalize a staff upload they own."""
        photo, game = self.builder.build('game')
        dm = UserFactory(username='dm')
        PlayerFactory(game=game, user=dm, is_dm=True)
        token = Token.objects.create(user=dm)
        upload = self._staff_upload(photo, photo.path, user=dm)
        assert self._patch(client, upload, 'uploading', token=token).status_code == 403

    def test_other_staff_user_gets_403(self, client):
        """Test that another staff member cannot finalize someone else's upload."""
        photo, _ = self.builder.build('game')
        upload = self._staff_upload(photo, photo.path)
        response = self._patch(client, upload, 'uploading', token=self.other_staff_token)
        assert response.status_code == 403
        assert response['X-Skip-Cache'] == 'true'

    def test_bad_token_gets_403(self, client):
        """Test that a wrong upload token is refused."""
        photo, _ = self.builder.build('game')
        upload = self._staff_upload(photo, photo.path)
        response = self._patch(client, upload, 'uploading', upload_token='wrong')
        assert response.status_code == 403

    def test_expired_upload_gets_403(self, client):
        """Test that an expired staff upload is refused."""
        photo, _ = self.builder.build('game')
        upload = self._staff_upload(
            photo, photo.path, expiration_time=timezone.now() - timedelta(minutes=1)
        )
        assert self._patch(client, upload, 'uploading').status_code == 403

    def test_already_uploaded_gets_403(self, client):
        """Test that a finished staff upload cannot be finalized again."""
        photo, _ = self.builder.build('game')
        upload = self._staff_upload(photo, photo.path)
        self._finalize(client, upload)
        assert self._patch(client, upload, 'uploaded').status_code == 403

    def test_mark_ready_handlers_are_skipped(self, client):
        """Test that replacing an orphan treasure photo does not re-point the treasure."""
        treasure = TreasureFactory(name='Crown')
        orphan, _ = self.builder.build('treasure', owner=treasure, path='photos/t/old.png')
        current, _ = self.builder.build('treasure', owner=treasure, path='photos/t/new.png')
        treasure.photo = current
        treasure.save()
        upload = self._staff_upload(orphan, 'photos/t/old.jpg')
        assert self._finalize(client, upload).status_code == 200
        treasure.refresh_from_db()
        assert treasure.photo_id == current.pk

    def test_gallery_owner_photo_unchanged(self, client):
        """Test that finalizing a staff replace never sets an unset gallery owner photo."""
        photo, game = self.builder.build('game', ready=False)
        upload = self._staff_upload(photo, photo.path)
        self._finalize(client, upload)
        game.refresh_from_db()
        assert game.photo_id is None

    def test_deleted_photo_returns_cleanup_path(self, client):
        """Test that a photo deleted mid-replace answers 404 with the upload's path."""
        photo, _ = self.builder.build('game', path='photos/x/p.png')
        upload = self._staff_upload(photo, 'photos/x/p.jpg')
        self._patch(client, upload, 'uploading')
        photo.delete()
        response = self._patch(client, upload, 'uploaded')
        assert response.status_code == 404
        assert response.json() == {'cleanup_path': 'photos/x/p.jpg'}
        assert response['X-Skip-Cache'] == 'true'

    def test_deleted_owner_returns_cleanup_path(self, client):
        """Test that deleting the owner (cascading the photo) answers 404 with cleanup_path."""
        photo, owner = self.builder.build('stl_model', path='photos/m/p.png')
        upload = self._staff_upload(photo, 'photos/m/p.gif')
        owner.delete()
        response = self._patch(client, upload, 'uploading')
        assert response.status_code == 404
        assert response.json() == {'cleanup_path': 'photos/m/p.gif'}


@pytest.mark.django_db
class TestUploadFinalizeRegularBranchUnchanged:
    """Regression tests: regular-origin uploads keep the per-type finalize behaviour."""

    def test_regular_upload_still_runs_mark_ready(self, client):
        """Test that a regular DM upload still sets an unset game photo on finalize."""
        photo, game = PhotoBuilder().build('game', ready=False)
        dm = UserFactory(username='dm_regular')
        PlayerFactory(game=game, user=dm, is_dm=True)
        token = Token.objects.create(user=dm)
        upload = Upload.objects.create(user=dm, file_path=photo.path, content_object=photo)
        response = client.patch(
            f'/uploads/image/{upload.pk}.json',
            data=json.dumps({'status': 'uploaded'}),
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Token {token.key}',
            HTTP_X_UPLOAD_TOKEN=upload.token,
        )
        assert response.status_code == 200
        assert response.content == b''
        assert response['X-Skip-Cache'] == 'true'
        game.refresh_from_db()
        assert game.photo_id == photo.pk
