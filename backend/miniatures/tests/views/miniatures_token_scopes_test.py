"""End-to-end tests for the `@token_scopes` declarations of the miniatures views (#1638)."""

import pytest
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient

from games.tests.factories import GameFactory, UserFactory
from games.tests.views.game._scoped_token_fixtures import ScopedTokenMixin
from miniatures.models import StlModel
from miniatures.tests.factories import CollectionFactory, SourceFactory, StlModelFactory

READ = 'miniatures:read'
WRITE = 'miniatures:write'
UPLOAD_PAYLOAD = {'filename': 'photo.png'}

READ_URLS = ['sources', 'source', 'stl_models', 'stl_model', 'collections', 'collection']

WRITES = [
    ('_create_source', 201),
    ('_create_stl_model', 201),
    ('_create_collection', 201),
    ('_import_stl_model', 200),
    ('_import_collection', 200),
    ('_update_stl_model', 200),
    ('_upload_source_photo', 201),
    ('_upload_stl_model_photo', 201),
    ('_upload_collection_photo', 201),
]

ROLE_WRITES = ['_create_source', '_import_stl_model', '_upload_collection_photo']


class MiniaturesScopedTokenMixin(ScopedTokenMixin):
    """Fixtures: a game, a staff user, a regular user, a source, an STL model and a collection."""

    def setup_method(self):
        """Set up the game, the users and the miniatures records."""
        self.client = APIClient()
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.staff = UserFactory(username='staffer', password='secret-password', is_staff=True)
        self.regular = UserFactory(username='regular', password='secret-password')
        self.source = SourceFactory(name='MyMiniFactory')
        self.stl_model = StlModelFactory(name='Dragon Miniature')
        self.collection = CollectionFactory(name='Monster Pack')

    def _read_url(self, name):
        """Return the read URL identified by `name`."""
        return {
            'sources': '/miniatures/sources.json',
            'source': f'/miniatures/sources/{self.source.id}.json',
            'stl_models': '/miniatures/stl_models.json',
            'stl_model': f'/miniatures/stl_models/{self.stl_model.id}.json',
            'collections': '/miniatures/collections.json',
            'collection': f'/miniatures/collections/{self.collection.id}.json',
        }[name]

    def _write(self, helper, user, scopes):
        """Call the write helper named `helper` as `user` with `scopes`."""
        return getattr(self, helper)(user, scopes)

    def _create_source(self, user, scopes):
        """POST a new source as `user` with `scopes`."""
        return self._post('/miniatures/sources.json', {'name': 'Thingiverse'}, user, scopes)

    def _create_stl_model(self, user, scopes):
        """POST a new STL model as `user` with `scopes`."""
        payload = {'name': 'Goblin Miniature', 'type': StlModel.TYPE_CREATURE}
        return self._post('/miniatures/stl_models.json', payload, user, scopes)

    def _create_collection(self, user, scopes):
        """POST a new collection as `user` with `scopes`."""
        return self._post('/miniatures/collections.json', {'name': 'Terrain Set'}, user, scopes)

    def _import_stl_model(self, user, scopes):
        """POST an STL model import as `user` with `scopes`."""
        payload = {'name': 'Dragon Miniature', 'source_name': 'Lootstudios'}
        return self._post('/miniatures/stl_models/import.json', payload, user, scopes)

    def _import_collection(self, user, scopes):
        """POST a collection import as `user` with `scopes`."""
        payload = {'name': 'Monster Pack', 'source_name': 'Lootstudios'}
        return self._post('/miniatures/collections/import.json', payload, user, scopes)

    def _update_stl_model(self, user, scopes):
        """PATCH the STL model as `user` with `scopes`."""
        url = f'/miniatures/stl_models/{self.stl_model.id}.json'
        return self._patch(url, {'name': 'Renamed'}, user, scopes)

    def _upload_source_photo(self, user, scopes):
        """POST the photo upload init for the source as `user` with `scopes`."""
        url = f'/miniatures/sources/{self.source.id}/photo_upload.json'
        return self._post(url, UPLOAD_PAYLOAD, user, scopes)

    def _upload_stl_model_photo(self, user, scopes):
        """POST the photo upload init for the STL model as `user` with `scopes`."""
        url = f'/miniatures/stl_models/{self.stl_model.id}/photo_upload.json'
        return self._post(url, UPLOAD_PAYLOAD, user, scopes)

    def _upload_collection_photo(self, user, scopes):
        """POST the photo upload init for the collection as `user` with `scopes`."""
        url = f'/miniatures/collections/{self.collection.id}/photo_upload.json'
        return self._post(url, UPLOAD_PAYLOAD, user, scopes)


@pytest.mark.django_db
class TestMiniaturesTokenScopesReads(MiniaturesScopedTokenMixin):
    """Every miniatures read needs `miniatures:read`."""

    @pytest.mark.parametrize('name', READ_URLS)
    def test_read_with_write_only_is_refused(self, name):
        """Test that a GET with `miniatures:write` alone gives `scope_missing`."""
        response = self._get(self._read_url(name), self.regular, [WRITE])
        self._assert_refused(response, 'scope_missing')

    @pytest.mark.parametrize('name', READ_URLS)
    def test_read_without_scopes_is_refused(self, name):
        """Test that a GET with no scopes gives `scope_missing`."""
        self._assert_refused(self._get(self._read_url(name), self.regular, []), 'scope_missing')

    @pytest.mark.parametrize('name', READ_URLS)
    def test_read_with_read_succeeds(self, name):
        """Test that a regular user's GET with `miniatures:read` answers 200."""
        assert self._get(self._read_url(name), self.regular, [READ]).status_code == 200

    def test_scoped_read_skips_cache(self):
        """Test that a scoped read still sets `X-Skip-Cache: true`."""
        response = self._get(self._read_url('stl_models'), self.regular, [READ])
        assert response['X-Skip-Cache'] == 'true'

    def test_read_ignores_game_list(self):
        """Test that a token limited to a game still reads stl_models.json."""
        url = self._read_url('stl_models')
        assert self._get(url, self.regular, [READ], games=[self.game]).status_code == 200


@pytest.mark.django_db
class TestMiniaturesTokenScopesWrites(MiniaturesScopedTokenMixin):
    """Every miniatures write needs `miniatures:write`."""

    @pytest.mark.parametrize('helper,_status', WRITES)
    def test_write_without_write_is_refused(self, helper, _status):
        """Test that a staff write with `miniatures:read` alone gives `scope_missing`."""
        self._assert_refused(self._write(helper, self.staff, [READ]), 'scope_missing')

    @pytest.mark.parametrize('helper,status', WRITES)
    def test_write_with_write_succeeds(self, helper, status):
        """Test that a staff write with `miniatures:write` succeeds."""
        assert self._write(helper, self.staff, [WRITE]).status_code == status


@pytest.mark.django_db
class TestMiniaturesTokenScopesOwnerIntersection(MiniaturesScopedTokenMixin):
    """A scoped token never does more than its owner's role allows."""

    @pytest.mark.parametrize('helper', ROLE_WRITES)
    def test_regular_write_is_forbidden(self, helper):
        """Test that a regular user holding `miniatures:write` still gets a role 403."""
        self._assert_role_refused(self._write(helper, self.regular, [READ, WRITE]))


@pytest.mark.django_db
class TestMiniaturesTokenScopesOtherCredentials(MiniaturesScopedTokenMixin):
    """Session and legacy `Token` requests are unaffected by scope declarations."""

    def test_session_reads_stl_models(self):
        """Test that a session still reads stl_models.json."""
        self._log_in(self.regular)
        assert self.client.get(self._read_url('stl_models')).status_code == 200

    def test_session_staff_creates_source(self):
        """Test that a staff session still creates a source."""
        self._log_in(self.staff)
        response = self.client.post(
            '/miniatures/sources.json', {'name': 'Thingiverse'}, format='json',
        )
        assert response.status_code == 201

    def test_legacy_token_reads_stl_models(self):
        """Test that a legacy Token still reads stl_models.json."""
        token = Token.objects.create(user=self.regular)
        response = self.client.get(
            self._read_url('stl_models'), HTTP_AUTHORIZATION=f'Token {token.key}',
        )
        assert response.status_code == 200

    def test_legacy_token_staff_creates_source(self):
        """Test that a staff legacy Token still creates a source."""
        token = Token.objects.create(user=self.staff)
        response = self.client.post(
            '/miniatures/sources.json', {'name': 'Thingiverse'}, format='json',
            HTTP_AUTHORIZATION=f'Token {token.key}',
        )
        assert response.status_code == 201
