"""End-to-end tests for the `@token_scopes` declarations of the PC views (issue #1631)."""

import pytest
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient

from accounts.models import ApiToken
from games.models import CharacterItem
from games.tests.factories import (
    CharacterFactory,
    GameDocumentFactory,
    GameFactory,
    GameItemFactory,
    PlayerFactory,
    UserFactory,
)


class ScopedTokenRequestMixin:
    """Shared fixtures: a game with a DM, an owning player and their PC, and another player."""

    def setup_method(self):
        """Set up the game, its members, the PC and a hidden item held by the PC."""
        self.client = APIClient()
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.other_game = GameFactory(name='Other Game', game_slug='other-game')
        owner_player = self._member('owner')
        self.owner = owner_player.user
        self.dm = self._member('dm', is_dm=True).user
        self.outsider = self._member('outsider').user
        self.character = CharacterFactory(
            name='Aragorn', game=self.game, npc=False, player=owner_player,
        )
        self.game_item = GameItemFactory(game=self.game, name='Sting')
        self.hidden_item = CharacterItem.objects.create(
            character=self.character, game_item=self.game_item, hidden=True,
        )

    def _member(self, username, is_dm=False):
        """Return a new player (or the DM) of the fixture game, with its own user."""
        user = UserFactory(username=username, password='secret-password')
        return PlayerFactory(name=username, game=self.game, user=user, is_dm=is_dm)

    def _bearer(self, user, scopes, games=None):
        """Return request kwargs carrying a fresh scoped token of `user`."""
        _, plain = ApiToken.objects.create_token(user, 'automation', scopes, games=games)
        return {'HTTP_AUTHORIZATION': f'Bearer {plain}'}

    def _pc_url(self, suffix=''):
        """Return the URL of the fixture PC followed by `suffix`."""
        return f'/games/test-game/pcs/{self.character.id}{suffix}'

    def _get(self, url, user, scopes, games=None):
        """Issue a GET to `url` with a scoped token of `user`."""
        return self.client.get(url, **self._bearer(user, scopes, games))

    def _post(self, url, payload, user, scopes):
        """Issue a JSON POST to `url` with a scoped token of `user`."""
        return self.client.post(url, payload, format='json', **self._bearer(user, scopes))

    def _assert_refused(self, response, code):
        """Assert a 403 carrying the token error `code`."""
        assert response.status_code == 403
        assert response.json() == {'errors': {'detail': [code]}}


@pytest.mark.django_db
class TestPcTokenScopesPublicReads(ScopedTokenRequestMixin):
    """Plain PC reads accept a token without any scope."""

    def test_pcs_list_needs_no_scope(self):
        """Test that pcs.json answers 200 for a token with no scopes."""
        response = self._get('/games/test-game/pcs.json', self.owner, [])
        assert response.status_code == 200

    def test_pc_detail_needs_no_scope(self):
        """Test that pcs/<id>.json answers 200 for a token with no scopes."""
        response = self._get(self._pc_url('.json'), self.owner, [])
        assert response.status_code == 200

    def test_pc_detail_patch_needs_pcs_write(self):
        """Test that PATCH pcs/<id>.json is refused without `pcs:write`."""
        url = self._pc_url('.json')
        response = self.client.patch(
            url, {'name': 'Strider'}, format='json', **self._bearer(self.owner, ['pcs:read']),
        )
        self._assert_refused(response, 'scope_missing')


@pytest.mark.django_db
class TestPcTokenScopesRefusals(ScopedTokenRequestMixin):
    """Scope and game refusals on a restricted PC read."""

    def test_full_with_other_family_scope_is_refused(self):
        """Test that full.json with only `npcs:read` gives `scope_missing`."""
        response = self._get(self._pc_url('/full.json'), self.owner, ['npcs:read'])
        self._assert_refused(response, 'scope_missing')

    def test_full_with_pcs_read_is_allowed(self):
        """Test that full.json with `pcs:read` answers 200 for the owner."""
        response = self._get(self._pc_url('/full.json'), self.owner, ['pcs:read'])
        assert response.status_code == 200

    def test_token_limited_to_another_game_is_refused(self):
        """Test that a token limited to another game gives `game_not_allowed`."""
        response = self._get(
            self._pc_url('/full.json'), self.owner, ['pcs:read'], games=[self.other_game],
        )
        self._assert_refused(response, 'game_not_allowed')

    def test_token_limited_to_the_game_is_allowed(self):
        """Test that a token limited to the PC's game answers 200."""
        response = self._get(
            self._pc_url('/full.json'), self.owner, ['pcs:read'], games=[self.game],
        )
        assert response.status_code == 200


@pytest.mark.django_db
class TestPcTokenScopesRestrictedReads(ScopedTokenRequestMixin):
    """Restricted reads need `pcs:read` plus the linked family's `read`."""

    def _item_full_url(self):
        """Return the full.json URL of the PC's hidden item."""
        return self._pc_url(f'/items/{self.hidden_item.id}/full.json')

    def test_item_full_with_pcs_read_only_is_refused(self):
        """Test that items/<id>/full.json with `pcs:read` alone gives `scope_missing`."""
        response = self._get(self._item_full_url(), self.owner, ['pcs:read'])
        self._assert_refused(response, 'scope_missing')

    def test_item_full_with_both_reads_is_allowed_for_owner(self):
        """Test that items/<id>/full.json with both reads answers 200 for the owner."""
        response = self._get(self._item_full_url(), self.owner, ['pcs:read', 'items:read'])
        assert response.status_code == 200

    def test_item_full_with_both_reads_is_allowed_for_dm(self):
        """Test that items/<id>/full.json with both reads answers 200 for the DM."""
        response = self._get(self._item_full_url(), self.dm, ['pcs:read', 'items:read'])
        assert response.status_code == 200

    def test_items_all_needs_items_read(self):
        """Test that items/all.json with `pcs:read` alone gives `scope_missing`."""
        response = self._get(self._pc_url('/items/all.json'), self.owner, ['pcs:read'])
        self._assert_refused(response, 'scope_missing')


@pytest.mark.django_db
class TestPcTokenScopesLinkWrites(ScopedTokenRequestMixin):
    """Link writes need `pcs:write`, plus the family's `read` on the `/all` variants."""

    def setup_method(self):
        """Add a hidden game document to the fixtures."""
        super().setup_method()
        self.hidden_document = GameDocumentFactory(game=self.game, name='Tome', hidden=True)

    def _acquire_document_all(self, scopes):
        """POST documents/acquire/all.json as the DM with `scopes`."""
        return self._post(
            self._pc_url('/documents/acquire/all.json'),
            {'game_document_id': self.hidden_document.id}, self.dm, scopes,
        )

    def test_item_acquire_with_pcs_write_succeeds(self):
        """Test that items/acquire.json succeeds with `pcs:write`."""
        response = self._post(
            self._pc_url('/items/acquire.json'), {'game_item_id': self.game_item.id},
            self.owner, ['pcs:write'],
        )
        assert response.status_code == 201

    def test_item_acquire_without_pcs_write_is_refused(self):
        """Test that items/acquire.json with only `items:write` gives `scope_missing`."""
        response = self._post(
            self._pc_url('/items/acquire.json'), {'game_item_id': self.game_item.id},
            self.owner, ['items:write'],
        )
        self._assert_refused(response, 'scope_missing')

    def test_document_acquire_all_with_pcs_write_only_is_refused(self):
        """Test that documents/acquire/all.json with `pcs:write` alone gives `scope_missing`."""
        self._assert_refused(self._acquire_document_all(['pcs:write']), 'scope_missing')

    def test_document_acquire_all_with_documents_read_succeeds(self):
        """Test that documents/acquire/all.json succeeds with `pcs:write` + `documents:read`."""
        response = self._acquire_document_all(['pcs:write', 'documents:read'])
        assert response.status_code == 201


@pytest.mark.django_db
class TestPcTokenScopesItemPhotoUpload(ScopedTokenRequestMixin):
    """The PC item photo upload needs both `pcs:write` and `items:write`."""

    def _upload(self, scopes):
        """POST the item photo upload init as the owner with `scopes`."""
        return self._post(
            self._pc_url(f'/items/{self.hidden_item.id}/photo_upload.json'),
            {'filename': 'sword.png'}, self.owner, scopes,
        )

    def test_pcs_write_only_is_refused(self):
        """Test that `pcs:write` alone gives `scope_missing`."""
        self._assert_refused(self._upload(['pcs:write']), 'scope_missing')

    def test_items_write_only_is_refused(self):
        """Test that `items:write` alone gives `scope_missing`."""
        self._assert_refused(self._upload(['items:write']), 'scope_missing')

    def test_both_writes_succeed(self):
        """Test that `pcs:write` + `items:write` answers 201."""
        assert self._upload(['pcs:write', 'items:write']).status_code == 201


@pytest.mark.django_db
class TestPcTokenScopesSummaries(ScopedTokenRequestMixin):
    """Plain summaries are public reads; `summary/all` needs `pcs:read` plus the family's read."""

    def _summary_url(self, suffix):
        """Return the item summary URL for the fixture PC followed by `suffix`."""
        return (
            f'/games/test-game/items/{self.game_item.id}/pcs/{self.character.id}/{suffix}'
        )

    def test_summary_needs_no_scope(self):
        """Test that summary.json answers 200 for a token with no scopes."""
        response = self._get(self._summary_url('summary.json'), self.owner, [])
        assert response.status_code == 200

    def test_summary_all_with_pcs_read_only_is_refused(self):
        """Test that summary/all.json with `pcs:read` alone gives `scope_missing`."""
        response = self._get(self._summary_url('summary/all.json'), self.dm, ['pcs:read'])
        self._assert_refused(response, 'scope_missing')

    def test_summary_all_with_both_reads_is_allowed(self):
        """Test that summary/all.json with `pcs:read` + `items:read` answers 200."""
        response = self._get(
            self._summary_url('summary/all.json'), self.dm, ['pcs:read', 'items:read'],
        )
        assert response.status_code == 200
        assert response.json() == {'quantity': 1}


@pytest.mark.django_db
class TestPcTokenScopesOwnerIntersection(ScopedTokenRequestMixin):
    """A token never grants more than its owner's role allows."""

    def test_non_owner_full_is_forbidden(self):
        """Test that a non-owner player with `pcs:*` still gets 403 on full.json."""
        response = self._get(self._pc_url('/full.json'), self.outsider, ['pcs:read', 'pcs:write'])
        assert response.status_code == 403
        assert response.json() != {'errors': {'detail': ['scope_missing']}}

    def test_non_owner_items_all_is_forbidden(self):
        """Test that a non-owner player with every needed scope still gets 403 on items/all."""
        response = self._get(
            self._pc_url('/items/all.json'), self.outsider, ['pcs:read', 'items:read'],
        )
        assert response.status_code == 403
        assert response.json() != {'errors': {'detail': ['scope_missing']}}


@pytest.mark.django_db
class TestPcTokenScopesOtherCredentials(ScopedTokenRequestMixin):
    """Session and legacy `Token` requests are unaffected by scope declarations."""

    def _log_in(self, user):
        """Store `user`'s auth token in the client session, as the login view does."""
        session = self.client.session
        session['auth_token'] = Token.objects.create(user=user).key
        session.save()

    def test_session_owner_reads_full(self):
        """Test that the owner's session still reads full.json."""
        self._log_in(self.owner)
        assert self.client.get(self._pc_url('/full.json')).status_code == 200

    def test_session_non_owner_is_forbidden(self):
        """Test that a non-owner's session still gets 403 on full.json."""
        self._log_in(self.outsider)
        assert self.client.get(self._pc_url('/full.json')).status_code == 403

    def test_legacy_token_owner_reads_item_full(self):
        """Test that the owner's legacy Token still reads an item's full.json."""
        token = Token.objects.create(user=self.owner)
        response = self.client.get(
            self._pc_url(f'/items/{self.hidden_item.id}/full.json'),
            HTTP_AUTHORIZATION=f'Token {token.key}',
        )
        assert response.status_code == 200

    def test_legacy_token_non_owner_is_forbidden(self):
        """Test that a non-owner's legacy Token still gets 403 on full.json."""
        token = Token.objects.create(user=self.outsider)
        response = self.client.get(
            self._pc_url('/full.json'), HTTP_AUTHORIZATION=f'Token {token.key}',
        )
        assert response.status_code == 403


@pytest.mark.django_db
class TestPcTokenScopesRecipesAvailable(ScopedTokenRequestMixin):
    """recipes/available.json is a gated read needing `pcs:read` plus `recipes:read`."""

    def _available(self, scopes):
        """GET recipes/available.json as the owner with `scopes`."""
        return self._get(self._pc_url('/recipes/available.json'), self.owner, scopes)

    def test_pcs_read_only_is_refused(self):
        """Test that `pcs:read` alone gives `scope_missing`."""
        self._assert_refused(self._available(['pcs:read']), 'scope_missing')

    def test_both_reads_are_allowed(self):
        """Test that `pcs:read` + `recipes:read` answers 200 for the owner."""
        assert self._available(['pcs:read', 'recipes:read']).status_code == 200


@pytest.mark.django_db
class TestPcTokenScopesItemDetailPatch(ScopedTokenRequestMixin):
    """PATCH items/<id>.json reaches hidden items, so it needs `pcs:write` plus `items:read`."""

    def _patch(self, scopes):
        """PATCH the hidden item's detail as the owner with `scopes`."""
        return self.client.patch(
            self._pc_url(f'/items/{self.hidden_item.id}.json'), {'name': 'Glamdring'},
            format='json', **self._bearer(self.owner, scopes),
        )

    def test_pcs_write_only_is_refused(self):
        """Test that `pcs:write` alone gives `scope_missing`."""
        self._assert_refused(self._patch(['pcs:write']), 'scope_missing')

    def test_write_and_items_read_succeed(self):
        """Test that `pcs:write` + `items:read` answers 200."""
        assert self._patch(['pcs:write', 'items:read']).status_code == 200


@pytest.mark.django_db
class TestPcTokenScopesCatalogueCreation(ScopedTokenRequestMixin):
    """Creating an item or possession writes a catalogue record, so it needs the family's write."""

    def _create(self, suffix, scopes):
        """POST a new record to the PC's `suffix` collection as the owner with `scopes`."""
        return self._post(self._pc_url(suffix), {'name': 'Lembas'}, self.owner, scopes)

    def test_item_create_with_pcs_write_only_is_refused(self):
        """Test that items.json POST with `pcs:write` alone gives `scope_missing`."""
        self._assert_refused(self._create('/items.json', ['pcs:write']), 'scope_missing')

    def test_item_create_with_both_writes_succeeds(self):
        """Test that items.json POST with `pcs:write` + `items:write` answers 201."""
        response = self._create('/items.json', ['pcs:write', 'items:write'])
        assert response.status_code == 201

    def test_possession_create_with_pcs_write_only_is_refused(self):
        """Test that possessions.json POST with `pcs:write` alone gives `scope_missing`."""
        self._assert_refused(self._create('/possessions.json', ['pcs:write']), 'scope_missing')

    def test_possession_create_with_both_writes_succeeds(self):
        """Test that possessions.json POST with `pcs:write` + `possessions:write` answers 201."""
        response = self._create('/possessions.json', ['pcs:write', 'possessions:write'])
        assert response.status_code == 201


@pytest.mark.django_db
class TestPcTokenScopesRemoveAll(ScopedTokenRequestMixin):
    """items/remove/all.json removes hidden links, so it needs `pcs:write` plus `items:read`."""

    def _remove_all(self, scopes):
        """POST items/remove/all.json for the hidden item as the DM with `scopes`."""
        return self._post(
            self._pc_url('/items/remove/all.json'), {'game_item_id': self.game_item.id},
            self.dm, scopes,
        )

    def test_pcs_write_only_is_refused(self):
        """Test that `pcs:write` alone gives `scope_missing`."""
        self._assert_refused(self._remove_all(['pcs:write']), 'scope_missing')

    def test_write_and_items_read_succeed(self):
        """Test that `pcs:write` + `items:read` answers 204."""
        assert self._remove_all(['pcs:write', 'items:read']).status_code == 204
