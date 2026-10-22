"""End-to-end tests for the `@token_scopes` declarations of the NPC views (issue #1632)."""

import pytest
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient

from games.models import CharacterItem
from games.tests.factories import (
    CharacterFactory,
    GameDocumentFactory,
    GameFactory,
    GameItemFactory,
)
from games.tests.views.game._scoped_token_fixtures import ScopedTokenMixin


class NpcScopedTokenRequestMixin(ScopedTokenMixin):
    """Shared fixtures: a game with a DM and a player, an NPC and a hidden item it holds."""

    def setup_method(self):
        """Set up the game, its members, the NPC and a hidden item held by the NPC."""
        self.client = APIClient()
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.other_game = GameFactory(name='Other Game', game_slug='other-game')
        self.dm = self._member('dm', is_dm=True).user
        self.player = self._member('player').user
        self.character = CharacterFactory(name='Gandalf', game=self.game, npc=True, player=None)
        self.game_item = GameItemFactory(game=self.game, name='Glamdring')
        self.hidden_item = CharacterItem.objects.create(
            character=self.character, game_item=self.game_item, hidden=True,
        )

    def _npc_url(self, suffix=''):
        """Return the URL of the fixture NPC followed by `suffix`."""
        return f'/games/test-game/npcs/{self.character.id}{suffix}'


@pytest.mark.django_db
class TestNpcTokenScopesPublicReads(NpcScopedTokenRequestMixin):
    """Plain NPC reads accept a token without any scope; the player update needs `npcs:write`."""

    def _patch_detail(self, scopes):
        """PATCH npcs/<id>.json as the player with `scopes`."""
        return self._patch(self._npc_url('.json'), {'name': 'Mithrandir'}, self.player, scopes)

    def test_npcs_list_needs_no_scope(self):
        """Test that npcs.json answers 200 for a token with no scopes."""
        response = self._get('/games/test-game/npcs.json', self.player, [])
        assert response.status_code == 200

    def test_npc_detail_needs_no_scope(self):
        """Test that npcs/<id>.json answers 200 for a token with no scopes."""
        response = self._get(self._npc_url('.json'), self.player, [])
        assert response.status_code == 200

    def test_npc_detail_patch_without_npcs_write_is_refused(self):
        """Test that PATCH npcs/<id>.json with only `npcs:read` gives `scope_missing`."""
        self._assert_refused(self._patch_detail(['npcs:read']), 'scope_missing')

    def test_npc_detail_patch_with_npcs_write_succeeds(self):
        """Test that PATCH npcs/<id>.json with `npcs:write` answers 200 for a player."""
        assert self._patch_detail(['npcs:write']).status_code == 200


@pytest.mark.django_db
class TestNpcTokenScopesRefusals(NpcScopedTokenRequestMixin):
    """Scope and game refusals on a restricted NPC read."""

    def test_full_with_pcs_read_is_refused(self):
        """Test that full.json with only `pcs:read` gives `scope_missing`."""
        response = self._get(self._npc_url('/full.json'), self.dm, ['pcs:read'])
        self._assert_refused(response, 'scope_missing')

    def test_full_with_npcs_read_is_allowed(self):
        """Test that full.json with `npcs:read` answers 200 for the DM."""
        response = self._get(self._npc_url('/full.json'), self.dm, ['npcs:read'])
        assert response.status_code == 200

    def test_token_limited_to_another_game_is_refused(self):
        """Test that a token limited to another game gives `game_not_allowed`."""
        response = self._get(
            self._npc_url('/full.json'), self.dm, ['npcs:read'], games=[self.other_game],
        )
        self._assert_refused(response, 'game_not_allowed')

    def test_token_limited_to_the_game_is_allowed(self):
        """Test that a token limited to the NPC's game answers 200."""
        response = self._get(
            self._npc_url('/full.json'), self.dm, ['npcs:read'], games=[self.game],
        )
        assert response.status_code == 200


@pytest.mark.django_db
class TestNpcTokenScopesHiddenNpcs(NpcScopedTokenRequestMixin):
    """Hidden-NPC listing and full creation need `npcs:read` / `npcs:write`."""

    def _create_full(self, scopes):
        """POST npcs/full.json as the DM with `scopes`."""
        return self._post('/games/test-game/npcs/full.json', {'name': 'Villain'}, self.dm, scopes)

    def test_all_without_scope_is_refused(self):
        """Test that npcs/all.json with no scopes gives `scope_missing`."""
        response = self._get('/games/test-game/npcs/all.json', self.dm, [])
        self._assert_refused(response, 'scope_missing')

    def test_all_with_npcs_read_is_allowed(self):
        """Test that npcs/all.json with `npcs:read` answers 200 for the DM."""
        response = self._get('/games/test-game/npcs/all.json', self.dm, ['npcs:read'])
        assert response.status_code == 200

    def test_full_create_with_npcs_read_is_refused(self):
        """Test that POST npcs/full.json with only `npcs:read` gives `scope_missing`."""
        self._assert_refused(self._create_full(['npcs:read']), 'scope_missing')

    def test_full_create_with_npcs_write_succeeds(self):
        """Test that POST npcs/full.json with `npcs:write` answers 201."""
        assert self._create_full(['npcs:write']).status_code == 201


@pytest.mark.django_db
class TestNpcTokenScopesRestrictedReads(NpcScopedTokenRequestMixin):
    """Restricted reads need `npcs:read` plus the linked family's `read`."""

    def _item_full_url(self):
        """Return the full.json URL of the NPC's hidden item."""
        return self._npc_url(f'/items/{self.hidden_item.id}/full.json')

    def test_item_full_with_npcs_read_only_is_refused(self):
        """Test that items/<id>/full.json with `npcs:read` alone gives `scope_missing`."""
        response = self._get(self._item_full_url(), self.dm, ['npcs:read'])
        self._assert_refused(response, 'scope_missing')

    def test_item_full_with_both_reads_is_allowed(self):
        """Test that items/<id>/full.json with both reads answers 200 for the DM."""
        response = self._get(self._item_full_url(), self.dm, ['npcs:read', 'items:read'])
        assert response.status_code == 200

    def test_treasures_all_with_npcs_read_only_is_refused(self):
        """Test that treasures/all.json with `npcs:read` alone gives `scope_missing`."""
        response = self._get(self._npc_url('/treasures/all.json'), self.dm, ['npcs:read'])
        self._assert_refused(response, 'scope_missing')

    def test_treasures_all_with_both_reads_is_allowed(self):
        """Test that treasures/all.json with `npcs:read` + `treasures:read` answers 200."""
        response = self._get(
            self._npc_url('/treasures/all.json'), self.dm, ['npcs:read', 'treasures:read'],
        )
        assert response.status_code == 200


@pytest.mark.django_db
class TestNpcTokenScopesLinkWrites(NpcScopedTokenRequestMixin):
    """Link writes need `npcs:write`, plus the family's `read` on the `/all` variants."""

    def setup_method(self):
        """Add a hidden game document to the fixtures."""
        super().setup_method()
        self.hidden_document = GameDocumentFactory(game=self.game, name='Tome', hidden=True)

    def _acquire_item(self, scopes):
        """POST items/acquire.json as the DM with `scopes`."""
        return self._post(
            self._npc_url('/items/acquire.json'), {'game_item_id': self.game_item.id},
            self.dm, scopes,
        )

    def _acquire_document_all(self, scopes):
        """POST documents/acquire/all.json as the DM with `scopes`."""
        return self._post(
            self._npc_url('/documents/acquire/all.json'),
            {'game_document_id': self.hidden_document.id}, self.dm, scopes,
        )

    def _remove_item_all(self, scopes):
        """POST items/remove/all.json for the hidden item as the DM with `scopes`."""
        return self._post(
            self._npc_url('/items/remove/all.json'), {'game_item_id': self.game_item.id},
            self.dm, scopes,
        )

    def test_item_acquire_with_npcs_write_succeeds(self):
        """Test that items/acquire.json succeeds with `npcs:write` alone."""
        assert self._acquire_item(['npcs:write']).status_code == 201

    def test_item_acquire_with_pcs_write_is_refused(self):
        """Test that items/acquire.json with only `pcs:write` gives `scope_missing`."""
        self._assert_refused(self._acquire_item(['pcs:write']), 'scope_missing')

    def test_document_acquire_all_with_npcs_write_only_is_refused(self):
        """Test that documents/acquire/all.json with `npcs:write` alone gives `scope_missing`."""
        self._assert_refused(self._acquire_document_all(['npcs:write']), 'scope_missing')

    def test_document_acquire_all_with_documents_read_succeeds(self):
        """Test that documents/acquire/all.json succeeds with `npcs:write` + `documents:read`."""
        response = self._acquire_document_all(['npcs:write', 'documents:read'])
        assert response.status_code == 201

    def test_item_remove_all_with_npcs_write_only_is_refused(self):
        """Test that items/remove/all.json with `npcs:write` alone gives `scope_missing`."""
        self._assert_refused(self._remove_item_all(['npcs:write']), 'scope_missing')

    def test_item_remove_all_with_items_read_succeeds(self):
        """Test that items/remove/all.json with `npcs:write` + `items:read` answers 204."""
        assert self._remove_item_all(['npcs:write', 'items:read']).status_code == 204


@pytest.mark.django_db
class TestNpcTokenScopesCatalogueCreation(NpcScopedTokenRequestMixin):
    """Creating an item or possession writes a catalogue record, so it needs the family's write."""

    def _create(self, suffix, scopes):
        """POST a new record to the NPC's `suffix` collection as the DM with `scopes`."""
        return self._post(self._npc_url(suffix), {'name': 'Lembas'}, self.dm, scopes)

    def test_item_create_with_npcs_write_only_is_refused(self):
        """Test that items.json POST with `npcs:write` alone gives `scope_missing`."""
        self._assert_refused(self._create('/items.json', ['npcs:write']), 'scope_missing')

    def test_item_create_with_both_writes_succeeds(self):
        """Test that items.json POST with `npcs:write` + `items:write` answers 201."""
        response = self._create('/items.json', ['npcs:write', 'items:write'])
        assert response.status_code == 201

    def test_possession_create_with_npcs_write_only_is_refused(self):
        """Test that possessions.json POST with `npcs:write` alone gives `scope_missing`."""
        self._assert_refused(self._create('/possessions.json', ['npcs:write']), 'scope_missing')

    def test_possession_create_with_both_writes_succeeds(self):
        """Test that possessions.json POST with `npcs:write` + `possessions:write` answers 201."""
        response = self._create('/possessions.json', ['npcs:write', 'possessions:write'])
        assert response.status_code == 201


@pytest.mark.django_db
class TestNpcTokenScopesItemPhotoUpload(NpcScopedTokenRequestMixin):
    """The NPC item photo upload needs both `npcs:write` and `items:write`."""

    def _upload(self, scopes):
        """POST the item photo upload init as the DM with `scopes`."""
        return self._post(
            self._npc_url(f'/items/{self.hidden_item.id}/photo_upload.json'),
            {'filename': 'sword.png'}, self.dm, scopes,
        )

    def test_npcs_write_only_is_refused(self):
        """Test that `npcs:write` alone gives `scope_missing`."""
        self._assert_refused(self._upload(['npcs:write']), 'scope_missing')

    def test_items_write_only_is_refused(self):
        """Test that `items:write` alone gives `scope_missing`."""
        self._assert_refused(self._upload(['items:write']), 'scope_missing')

    def test_both_writes_succeed(self):
        """Test that `npcs:write` + `items:write` answers 201."""
        assert self._upload(['npcs:write', 'items:write']).status_code == 201


@pytest.mark.django_db
class TestNpcTokenScopesSummaries(NpcScopedTokenRequestMixin):
    """Plain summaries are public reads; `summary/all` needs `npcs:read` plus the family's read."""

    def _summary_url(self, suffix):
        """Return the item summary URL for the fixture NPC followed by `suffix`."""
        return (
            f'/games/test-game/items/{self.game_item.id}/npcs/{self.character.id}/{suffix}'
        )

    def test_summary_needs_no_scope(self):
        """Test that summary.json answers 200 for a token with no scopes."""
        response = self._get(self._summary_url('summary.json'), self.player, [])
        assert response.status_code == 200

    def test_summary_all_with_npcs_read_only_is_refused(self):
        """Test that summary/all.json with `npcs:read` alone gives `scope_missing`."""
        response = self._get(self._summary_url('summary/all.json'), self.dm, ['npcs:read'])
        self._assert_refused(response, 'scope_missing')

    def test_summary_all_with_both_reads_is_allowed(self):
        """Test that summary/all.json with `npcs:read` + `items:read` answers 200."""
        response = self._get(
            self._summary_url('summary/all.json'), self.dm, ['npcs:read', 'items:read'],
        )
        assert response.status_code == 200
        assert response.json() == {'quantity': 1}


@pytest.mark.django_db
class TestNpcTokenScopesPhotos(NpcScopedTokenRequestMixin):
    """NPC photos follow the `npcs` family."""

    def _upload(self, scopes):
        """POST the NPC photo upload init as the DM with `scopes`."""
        return self._post(
            self._npc_url('/photo_upload.json'), {'filename': 'portrait.png'}, self.dm, scopes,
        )

    def test_photos_all_without_scope_is_refused(self):
        """Test that photos/all.json with no scopes gives `scope_missing`."""
        response = self._get(self._npc_url('/photos/all.json'), self.dm, [])
        self._assert_refused(response, 'scope_missing')

    def test_photos_all_with_npcs_read_is_allowed(self):
        """Test that photos/all.json with `npcs:read` answers 200 for the DM."""
        response = self._get(self._npc_url('/photos/all.json'), self.dm, ['npcs:read'])
        assert response.status_code == 200

    def test_photo_upload_with_npcs_read_is_refused(self):
        """Test that photo_upload.json with only `npcs:read` gives `scope_missing`."""
        self._assert_refused(self._upload(['npcs:read']), 'scope_missing')

    def test_photo_upload_with_npcs_write_succeeds(self):
        """Test that photo_upload.json with `npcs:write` answers 201."""
        assert self._upload(['npcs:write']).status_code == 201


@pytest.mark.django_db
class TestNpcTokenScopesOwnerIntersection(NpcScopedTokenRequestMixin):
    """A token never grants more than its owner's role allows."""

    def test_player_npcs_all_is_forbidden(self):
        """Test that a player with `npcs:read` still gets 403 on npcs/all.json."""
        response = self._get('/games/test-game/npcs/all.json', self.player, ['npcs:read'])
        self._assert_role_refused(response)

    def test_player_full_is_forbidden(self):
        """Test that a player with `npcs:*` still gets 403 on full.json."""
        response = self._get(
            self._npc_url('/full.json'), self.player, ['npcs:read', 'npcs:write'],
        )
        self._assert_role_refused(response)

    def test_player_items_all_is_forbidden(self):
        """Test that a player with every needed scope still gets 403 on items/all.json."""
        response = self._get(
            self._npc_url('/items/all.json'), self.player, ['npcs:read', 'items:read'],
        )
        self._assert_role_refused(response)


@pytest.mark.django_db
class TestNpcTokenScopesOtherCredentials(NpcScopedTokenRequestMixin):
    """Session and legacy `Token` requests are unaffected by scope declarations."""

    def test_session_dm_reads_full(self):
        """Test that the DM's session still reads full.json."""
        self._log_in(self.dm)
        assert self.client.get(self._npc_url('/full.json')).status_code == 200

    def test_session_player_is_forbidden(self):
        """Test that a player's session still gets 403 on full.json."""
        self._log_in(self.player)
        assert self.client.get(self._npc_url('/full.json')).status_code == 403

    def test_legacy_token_dm_reads_item_full(self):
        """Test that the DM's legacy Token still reads an item's full.json."""
        token = Token.objects.create(user=self.dm)
        response = self.client.get(
            self._npc_url(f'/items/{self.hidden_item.id}/full.json'),
            HTTP_AUTHORIZATION=f'Token {token.key}',
        )
        assert response.status_code == 200

    def test_legacy_token_player_is_forbidden(self):
        """Test that a player's legacy Token still gets 403 on full.json."""
        token = Token.objects.create(user=self.player)
        response = self.client.get(
            self._npc_url('/full.json'), HTTP_AUTHORIZATION=f'Token {token.key}',
        )
        assert response.status_code == 403


@pytest.mark.django_db
class TestNpcTokenScopesRecipesAvailable(NpcScopedTokenRequestMixin):
    """recipes/available.json is a gated read needing `npcs:read` plus `recipes:read`."""

    def _available(self, scopes):
        """GET recipes/available.json as the DM with `scopes`."""
        return self._get(self._npc_url('/recipes/available.json'), self.dm, scopes)

    def test_npcs_read_only_is_refused(self):
        """Test that `npcs:read` alone gives `scope_missing`."""
        self._assert_refused(self._available(['npcs:read']), 'scope_missing')

    def test_both_reads_are_allowed(self):
        """Test that `npcs:read` + `recipes:read` answers 200 for the DM."""
        assert self._available(['npcs:read', 'recipes:read']).status_code == 200
