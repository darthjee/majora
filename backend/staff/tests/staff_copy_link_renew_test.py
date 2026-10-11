"""Tests for the staff copy-link renew view (POST /staff/copies/links/<id>/renew.json)."""

import json
from datetime import timedelta

import pytest
from django.utils import timezone

from staff.tests.copy_test_support import StaffCopyGateBehavior
from staff.tests.photo_builders import PhotoBuilder
from uploads.models import Upload


def renew_url(upload_id):
    """Return the renew URL of `upload_id`."""
    return f'/staff/copies/links/{upload_id}/renew.json'


@pytest.mark.django_db
class TestStaffCopyLinkRenew(StaffCopyGateBehavior):
    """Tests for renewing a copy link upload."""

    def setup_method(self):
        """Set up the actors, a copied item photo and a pending copy upload."""
        self.setup_actors()
        self.photo, _ = PhotoBuilder().build('game_item', ready=False)
        self.upload = self._upload()

    def _upload(self, **kwargs):
        """Create a copy upload (or another origin) linking the photo, owned by the superuser."""
        kwargs.setdefault('origin', Upload.ORIGIN_COPY)
        return Upload.objects.create(
            user=self.superuser, content_object=self.photo, file_path='photos/t/copy.png',
            source_path='photos/s/source.png', **kwargs,
        )

    def send(self, client, token=None):
        """Issue a POST renew on the pending copy upload."""
        return self.post_json(client, renew_url(self.upload.pk), {}, token)

    def send_wrong_method(self, client, token=None):
        """Issue a GET on the renew URL."""
        return self.get_json(client, renew_url(self.upload.pk), token)

    def _renew(self, client, upload, token=None):
        """Renew `upload` as staff (or the given token)."""
        return self.post_json(client, renew_url(upload.pk), {}, token or self.staff_token)

    def _patch(self, client, upload, upload_token):
        """Issue a finalize PATCH `uploading` on `upload` as staff with `upload_token`."""
        return client.patch(
            f'/uploads/image/{upload.pk}.json',
            data=json.dumps({'status': 'uploading'}),
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Token {self.staff_token.key}',
            HTTP_X_UPLOAD_TOKEN=upload_token,
        )

    def test_staff_gets_200_with_skip_cache(self, client):
        """Test that a staff user gets 200 with X-Skip-Cache."""
        response = self.send(client, self.staff_token)
        assert response.status_code == 200
        assert response['X-Skip-Cache'] == 'true'

    def test_superuser_returns_200(self, client):
        """Test that a superuser can renew a link."""
        assert self.send(client, self.superuser_token).status_code == 200

    def test_unauthenticated_missing_id_returns_401(self, client):
        """Test that the gate runs before the id is resolved for anonymous callers."""
        assert self.post_json(client, renew_url(999999), {}).status_code == 401

    def test_regular_user_missing_id_returns_403(self, client):
        """Test that the gate runs before the id is resolved for regular users."""
        response = self.post_json(client, renew_url(999999), {}, self.regular_token)
        assert response.status_code == 403

    def test_missing_upload_returns_404(self, client):
        """Test that a missing upload returns 404."""
        response = self.post_json(client, renew_url(999999), {}, self.staff_token)
        assert response.status_code == 404

    @pytest.mark.parametrize('origin', [Upload.ORIGIN_REGULAR, Upload.ORIGIN_STAFF])
    def test_non_copy_upload_returns_404(self, client, origin):
        """Test that a regular or staff upload returns 404 and keeps its token."""
        upload = self._upload(origin=origin)
        token = upload.token
        assert self._renew(client, upload).status_code == 404
        upload.refresh_from_db()
        assert upload.token == token

    def test_uploaded_returns_409(self, client):
        """Test that an uploaded copy upload returns 409."""
        upload = self._upload(status=Upload.STATUS_UPLOADED)
        assert self._renew(client, upload).status_code == 409

    def test_uploading_not_expired_returns_409(self, client):
        """Test that a link in flight returns 409 and keeps its token."""
        upload = self._upload(status=Upload.STATUS_UPLOADING)
        token = upload.token
        assert self._renew(client, upload).status_code == 409
        upload.refresh_from_db()
        assert upload.token == token

    def test_pending_is_renewed(self, client):
        """Test that a pending upload is renewed with a new token."""
        response = self._renew(client, self.upload)
        self.upload.refresh_from_db()
        assert response.status_code == 200
        assert response.json() == {
            'upload_id': self.upload.pk, 'upload_type': 'image', 'token': self.upload.token,
        }
        assert self.upload.status == Upload.STATUS_PENDING

    def test_failed_is_renewed_and_error_cleared(self, client):
        """Test that a failed upload goes back to pending with no error."""
        upload = self._upload(status=Upload.STATUS_FAILED, error='cross_device')
        assert self._renew(client, upload).status_code == 200
        upload.refresh_from_db()
        assert (upload.status, upload.error) == (Upload.STATUS_PENDING, None)

    def test_expired_uploading_is_renewed(self, client):
        """Test that an expired uploading link is renewed with a future expiry."""
        upload = self._upload(
            status=Upload.STATUS_UPLOADING,
            expiration_time=timezone.now() - timedelta(minutes=1),
        )
        assert self._renew(client, upload).status_code == 200
        upload.refresh_from_db()
        assert upload.status == Upload.STATUS_PENDING
        assert upload.expiration_time > timezone.now()

    def test_user_is_reassigned_to_renewing_staff(self, client):
        """Test that the upload now belongs to the renewing staff member."""
        self._renew(client, self.upload)
        self.upload.refresh_from_db()
        assert self.upload.user == self.staff_user

    def test_old_token_stops_working_and_new_one_works(self, client):
        """Test that only the re-issued token is accepted by the finalize PATCH."""
        old_token = self.upload.token
        new_token = self._renew(client, self.upload).json()['token']
        assert new_token != old_token
        assert self._patch(client, self.upload, old_token).status_code == 403
        assert self._patch(client, self.upload, new_token).status_code == 200

    def test_response_has_no_paths(self, client):
        """Test that the response exposes no paths."""
        body = self._renew(client, self.upload).json()
        assert set(body) == {'upload_id', 'upload_type', 'token'}
