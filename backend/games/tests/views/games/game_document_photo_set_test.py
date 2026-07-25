"""Tests for the game document photo set (display) endpoint."""

import pytest
from rest_framework.authtoken.models import Token

from games.models import GameDocumentPhoto
from games.tests.behaviors import TokenAuthRequestMixin
from games.tests.factories import (
    GameDocumentFactory,
    GameFactory,
    PlayerFactory,
    SuperUserFactory,
    UserFactory,
)


@pytest.mark.django_db
class TestGameDocumentPhotoSetView(TokenAuthRequestMixin):
    """Tests for PATCH /games/<game_slug>/documents/<document_id>/photos/<photo_id>/set.json."""

    def setup_method(self):
        """Set up a game, a document, a photo, a DM, and a player."""
        self.game = GameFactory(name='Epic Quest', game_slug='epic-quest')
        self.document = GameDocumentFactory(game=self.game, name='Ancient Scroll')
        self.photo = GameDocumentPhoto.objects.create(
            path=f'photos/games/epic-quest/documents/{self.document.id}/img1.jpg',
            game_document=self.document,
        )
        self.dm_user = UserFactory(username='dm_user', password='secret-password')
        PlayerFactory(game=self.game, user=self.dm_user, is_dm=True)
        self.dm_token = Token.objects.create(user=self.dm_user)
        self.player_user = UserFactory(username='player_user', password='secret-password')
        PlayerFactory(name='Bob', user=self.player_user, game=self.game)
        self.player_token = Token.objects.create(user=self.player_user)

    def _url(self, document_id=None, photo_id=None):
        """Return the set endpoint URL for the given document/photo id (defaults to fixtures)."""
        document_id = document_id if document_id is not None else self.document.id
        photo_id = photo_id if photo_id is not None else self.photo.id
        return f'/games/epic-quest/documents/{document_id}/photos/{photo_id}/set.json'

    def _patch(self, client, payload, token=None, document_id=None, photo_id=None):
        """Issue a PATCH request to the photo set endpoint, optionally with a token."""
        return self.patch(client, self._url(document_id, photo_id), payload, token=token)

    def test_unauthenticated_request_returns_401(self, client):
        """Test that a request without a token is rejected with 401."""
        response = self._patch(client, {'roles': ['display']})
        assert response.status_code == 401

    def test_unrelated_user_returns_403(self, client):
        """Test that an authenticated user unrelated to the game is rejected with 403."""
        other = UserFactory(username='other', password='secret-password')
        token = Token.objects.create(user=other)
        response = self._patch(client, {'roles': ['display']}, token=token)
        assert response.status_code == 403

    def test_unknown_game_slug_returns_404(self, client):
        """Test that an unknown game slug returns 404."""
        response = client.patch(
            f'/games/unknown-game/documents/{self.document.id}/photos/{self.photo.id}/set.json',
            data='{"roles": ["display"]}',
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Token {self.dm_token.key}',
        )
        assert response.status_code == 404

    def test_unknown_document_id_returns_404(self, client):
        """Test that a non-existent document_id returns 404."""
        response = self._patch(
            client, {'roles': ['display']}, token=self.dm_token, document_id=99999
        )
        assert response.status_code == 404

    def test_document_from_different_game_returns_404(self, client):
        """Test that a document_id belonging to a different game returns 404."""
        other_game = GameFactory(name='Other Game', game_slug='other-game')
        other_document = GameDocumentFactory(game=other_game, name='Other Document')
        response = self._patch(
            client, {'roles': ['display']}, token=self.dm_token, document_id=other_document.id
        )
        assert response.status_code == 404

    def test_unknown_photo_id_returns_404(self, client):
        """Test that a non-existent photo_id returns 404."""
        response = self._patch(
            client, {'roles': ['display']}, token=self.dm_token, photo_id=99999
        )
        assert response.status_code == 404

    def test_photo_of_another_document_returns_404(self, client):
        """Test that a photo id belonging to a different document returns 404."""
        other_document = GameDocumentFactory(game=self.game, name='Other Document')
        other_photo = GameDocumentPhoto.objects.create(
            path=f'photos/games/epic-quest/documents/{other_document.id}/img1.jpg',
            game_document=other_document,
        )
        response = self._patch(
            client, {'roles': ['display']}, token=self.dm_token, photo_id=other_photo.id
        )
        assert response.status_code == 404

    def test_happy_path_sets_display_photo(self, client):
        """Test that sending roles=['display'] sets the document's display photo."""
        response = self._patch(client, {'roles': ['display']}, token=self.dm_token)
        assert response.status_code == 200
        self.document.refresh_from_db()
        assert self.document.photo == self.photo

    def test_replaces_existing_display_photo(self, client):
        """Test that setting a new display photo replaces a previously set one."""
        previous_photo = GameDocumentPhoto.objects.create(
            path=f'photos/games/epic-quest/documents/{self.document.id}/img2.jpg',
            game_document=self.document,
        )
        self.document.photo = previous_photo
        self.document.save()

        response = self._patch(client, {'roles': ['display']}, token=self.dm_token)
        assert response.status_code == 200
        self.document.refresh_from_db()
        assert self.document.photo == self.photo

    def test_empty_roles_is_a_noop(self, client):
        """Test that an empty roles array is a no-op and still returns 200."""
        response = self._patch(client, {'roles': []}, token=self.dm_token)
        assert response.status_code == 200
        self.document.refresh_from_db()
        assert self.document.photo is None

    def test_unrecognized_role_is_a_noop(self, client):
        """Test that unrecognized roles are ignored and still return 200."""
        response = self._patch(client, {'roles': ['something-else']}, token=self.dm_token)
        assert response.status_code == 200
        self.document.refresh_from_db()
        assert self.document.photo is None

    def test_superuser_can_set_display_photo(self, client):
        """Test that a superuser is allowed to set the display photo for any document."""
        superuser = SuperUserFactory(username='admin', password='secret-password')
        token = Token.objects.create(user=superuser)
        response = self._patch(client, {'roles': ['display']}, token=token)
        assert response.status_code == 200

    def test_staff_user_returns_200(self, client):
        """Test that an is_staff=True user unrelated to the game can set the display photo."""
        staff_user = UserFactory(username='staff_user', password='secret-password', is_staff=True)
        token = Token.objects.create(user=staff_user)
        response = self._patch(client, {'roles': ['display']}, token=token)
        assert response.status_code == 200

    def test_player_of_game_returns_200(self, client):
        """Test that a player of the game can set the document's display photo."""
        response = self._patch(client, {'roles': ['display']}, token=self.player_token)
        assert response.status_code == 200

    def test_dm_authenticated_via_session_cookie_returns_200(self, client):
        """Test that a DM authenticated via session cookie (no auth header) succeeds."""
        session = client.session
        session['auth_token'] = self.dm_token.key
        session.save()
        response = client.patch(
            self._url(),
            data='{"roles": ["display"]}',
            content_type='application/json',
        )
        assert response.status_code == 200
