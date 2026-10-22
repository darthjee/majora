"""End-to-end tests for scoped API tokens on the upload finalize endpoint (issue #1639)."""

import pytest
from rest_framework.test import APIClient

from accounts.scopes import SCOPES
from games.models import (
    CharacterItemPhoto,
    CharacterPhoto,
    GameDocumentPhoto,
    GamePhoto,
    TreasurePhoto,
)
from games.tests.factories import (
    CharacterFactory,
    CharacterItemFactory,
    GameDocumentFactory,
    GameFactory,
    TreasureFactory,
    UserFactory,
)
from games.tests.views.game._scoped_token_fixtures import ScopedTokenMixin
from miniatures.models import StlModelPhoto
from miniatures.tests.factories import StlModelFactory
from uploads.models import Upload


class UploadFinalizeTokenMixin(ScopedTokenMixin):
    """Shared fixtures: a game with a DM, a player owning a PC, an NPC and another game."""

    def setup_method(self):
        """Set up the games, their members and the characters."""
        self.client = APIClient()
        self.game = GameFactory(name='Epic Quest', game_slug='epic-quest')
        self.other_game = GameFactory(name='Other Game', game_slug='other-game')
        self.dm = self._member('dm', is_dm=True).user
        self.player = self._member('player')
        self.pc = CharacterFactory(name='Aragorn', game=self.game, player=self.player, npc=False)
        self.npc = CharacterFactory(name='Gollum', game=self.game, npc=True)

    def _upload(self, content_object, user=None, origin=Upload.ORIGIN_REGULAR):
        """Create a pending upload of `content_object` owned by `user` (default: the DM)."""
        return Upload.objects.create(
            user=user or self.dm, file_path='photos/finalize.jpg',
            content_object=content_object, origin=origin,
        )

    def _finalize(self, upload, scopes, games=None):
        """PATCH `upload` to `uploading` with a scoped token of its owner."""
        url = f'/uploads/image/{upload.pk}.json'
        auth = self._bearer(upload.user, scopes, games)
        return self.client.patch(
            url, {'status': 'uploading'}, format='json',
            HTTP_X_UPLOAD_TOKEN=upload.token, **auth,
        )

    def _game_photo_upload(self, user=None):
        """Return a pending `GamePhoto` upload of the fixture game."""
        return self._upload(GamePhoto.objects.create(game=self.game), user)

    def _character_photo_upload(self, character):
        """Return a pending `CharacterPhoto` upload of `character`, owned by the DM."""
        return self._upload(CharacterPhoto.objects.create(character=character))

    def _character_item_photo_upload(self, character):
        """Return a pending `CharacterItemPhoto` upload of an item of `character`."""
        character_item = CharacterItemFactory(character=character)
        return self._upload(CharacterItemPhoto.objects.create(character_item=character_item))


@pytest.mark.django_db
class TestUploadFinalizeTokenFamilies(UploadFinalizeTokenMixin):
    """The required scopes come from the upload's linked object."""

    def test_pc_photo_with_pcs_write_is_allowed(self):
        """Test that a PC photo finalizes with `pcs:write`."""
        response = self._finalize(self._character_photo_upload(self.pc), ['pcs:write'])
        assert response.status_code == 200

    def test_pc_photo_with_npcs_write_is_refused(self):
        """Test that a PC photo with only `npcs:write` gives `scope_missing`."""
        response = self._finalize(self._character_photo_upload(self.pc), ['npcs:write'])
        self._assert_refused(response, 'scope_missing')

    def test_npc_photo_with_npcs_write_is_allowed(self):
        """Test that an NPC photo finalizes with `npcs:write`."""
        response = self._finalize(self._character_photo_upload(self.npc), ['npcs:write'])
        assert response.status_code == 200

    def test_npc_photo_with_pcs_write_is_refused(self):
        """Test that an NPC photo with only `pcs:write` gives `scope_missing`."""
        response = self._finalize(self._character_photo_upload(self.npc), ['pcs:write'])
        self._assert_refused(response, 'scope_missing')

    def test_pc_item_photo_needs_items_write(self):
        """Test that a PC item photo with only `pcs:write` gives `scope_missing`."""
        response = self._finalize(self._character_item_photo_upload(self.pc), ['pcs:write'])
        self._assert_refused(response, 'scope_missing')

    def test_pc_item_photo_needs_the_character_family(self):
        """Test that a PC item photo with only `items:write` gives `scope_missing`."""
        response = self._finalize(self._character_item_photo_upload(self.pc), ['items:write'])
        self._assert_refused(response, 'scope_missing')

    def test_pc_item_photo_with_both_scopes_is_allowed(self):
        """Test that a PC item photo finalizes with `pcs:write` and `items:write`."""
        upload = self._character_item_photo_upload(self.pc)
        assert self._finalize(upload, ['pcs:write', 'items:write']).status_code == 200

    def test_npc_item_photo_with_both_scopes_is_allowed(self):
        """Test that an NPC item photo finalizes with `npcs:write` and `items:write`."""
        upload = self._character_item_photo_upload(self.npc)
        assert self._finalize(upload, ['npcs:write', 'items:write']).status_code == 200

    def test_document_photo_with_documents_write_is_allowed(self):
        """Test that a document photo finalizes with `documents:write`."""
        document = GameDocumentFactory(game=self.game)
        upload = self._upload(GameDocumentPhoto.objects.create(game_document=document))
        assert self._finalize(upload, ['documents:write']).status_code == 200

    def test_document_photo_without_documents_write_is_refused(self):
        """Test that a document photo with only `games:write` gives `scope_missing`."""
        document = GameDocumentFactory(game=self.game)
        upload = self._upload(GameDocumentPhoto.objects.create(game_document=document))
        self._assert_refused(self._finalize(upload, ['games:write']), 'scope_missing')

    def test_game_photo_with_games_write_is_allowed(self):
        """Test that a game photo finalizes with `games:write`."""
        assert self._finalize(self._game_photo_upload(), ['games:write']).status_code == 200

    def test_game_photo_without_games_write_is_refused(self):
        """Test that a game photo with only `games:read` gives `scope_missing`."""
        response = self._finalize(self._game_photo_upload(), ['games:read'])
        self._assert_refused(response, 'scope_missing')


@pytest.mark.django_db
class TestUploadFinalizeTokenGames(UploadFinalizeTokenMixin):
    """The token's game list must include the linked object's game, when it has one."""

    def test_token_for_another_game_is_refused(self):
        """Test that a token restricted to another game gives `game_not_allowed`."""
        response = self._finalize(self._game_photo_upload(), ['games:write'], [self.other_game])
        self._assert_refused(response, 'game_not_allowed')

    def test_token_for_the_game_is_allowed(self):
        """Test that a token whose game list includes the game answers 200."""
        response = self._finalize(self._game_photo_upload(), ['games:write'], [self.game])
        assert response.status_code == 200

    def test_missing_scope_is_checked_before_the_game(self):
        """Test that a token lacking the scope on another game gives `scope_missing`."""
        response = self._finalize(self._game_photo_upload(), ['pcs:write'], [self.other_game])
        self._assert_refused(response, 'scope_missing')

    def test_catalogue_treasure_photo_skips_the_game_check(self):
        """Test that a catalogue treasure photo finalizes whatever the token's games."""
        staff = UserFactory(username='staffer', is_staff=True)
        photo = TreasurePhoto.objects.create(treasure=TreasureFactory())
        upload = self._upload(photo, staff)
        response = self._finalize(upload, ['treasures:write'], [self.other_game])
        assert response.status_code == 200

    def test_miniatures_photo_skips_the_game_check(self):
        """Test that a staff owner's miniatures photo finalizes with `miniatures:write`."""
        staff = UserFactory(username='staffer', is_staff=True)
        upload = self._upload(StlModelPhoto.objects.create(stl_model=StlModelFactory()), staff)
        response = self._finalize(upload, ['miniatures:write'], [self.other_game])
        assert response.status_code == 200


@pytest.mark.django_db
class TestUploadFinalizeTokenOrigins(UploadFinalizeTokenMixin):
    """Staff- and copy-origin uploads never accept a scoped token."""

    def setup_method(self):
        """Set up the fixtures plus a staff user."""
        super().setup_method()
        self.staff = UserFactory(username='staffer', is_staff=True)

    def test_staff_origin_is_refused(self):
        """Test that a staff-origin upload gives `token_not_allowed`, even with every scope."""
        photo = GamePhoto.objects.create(game=self.game)
        upload = self._upload(photo, self.staff, Upload.ORIGIN_STAFF)
        self._assert_refused(self._finalize(upload, list(SCOPES)), 'token_not_allowed')

    def test_copy_origin_is_refused(self):
        """Test that a copy-origin upload gives `token_not_allowed`, even with every scope."""
        photo = GamePhoto.objects.create(game=self.game)
        upload = self._upload(photo, self.staff, Upload.ORIGIN_COPY)
        self._assert_refused(self._finalize(upload, list(SCOPES)), 'token_not_allowed')


@pytest.mark.django_db
class TestUploadFinalizeTokenRoles(UploadFinalizeTokenMixin):
    """A scope never grants more than the owner's role."""

    def test_non_editor_with_the_scope_gets_a_role_refusal(self):
        """Test that a non-DM player's game photo upload is refused by the role check."""
        response = self._finalize(self._game_photo_upload(self.player.user), ['games:write'])
        self._assert_role_refused(response)

    def test_non_staff_with_miniatures_write_gets_a_role_refusal(self):
        """Test that a non-staff owner's miniatures photo is refused by the role check."""
        photo = StlModelPhoto.objects.create(stl_model=StlModelFactory())
        response = self._finalize(self._upload(photo, self.dm), ['miniatures:write'])
        self._assert_role_refused(response)
