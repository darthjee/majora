"""Unit tests for `UploadTokenScopeCheck` and its `_SCOPE_RULES` map (issue #1639)."""

from types import SimpleNamespace

import pytest

from accounts.authentication import ApiTokenNotAllowed, GameNotAllowed, ScopeMissing
from accounts.models import ApiToken
from accounts.scopes import SCOPES
from games.models import (
    CharacterItemPhoto,
    CharacterPhoto,
    GameCommonItemPhoto,
    GameDocumentFile,
    GameDocumentFilePhoto,
    GameDocumentPhoto,
    GameFactionPhoto,
    GameItemPhoto,
    GamePhoto,
    GamePossessionPhoto,
    TreasurePhoto,
)
from games.tests.factories import GameDocumentFactory, GameFactory, UserFactory
from miniatures.models import CollectionPhoto, SourcePhoto, StlModelPhoto
from uploads import upload_token_scope_check
from uploads.models import Upload
from uploads.upload_token_scope_check import _SCOPE_RULES, UploadTokenScopeCheck
from uploads.views import _PHOTO_HANDLERS


def _character(npc):
    """Return a stand-in character of game 7."""
    return SimpleNamespace(npc=npc, game_id=7)


# Stand-in content objects carrying only the attributes each rule reads, per model.
_STAND_INS = {
    GamePhoto: [SimpleNamespace(game_id=7)],
    CharacterPhoto: [SimpleNamespace(character=_character(npc)) for npc in (True, False)],
    CharacterItemPhoto: [
        SimpleNamespace(character_item=SimpleNamespace(character=_character(npc)))
        for npc in (True, False)
    ],
    GameItemPhoto: [SimpleNamespace(game_item=SimpleNamespace(game_id=7))],
    GamePossessionPhoto: [SimpleNamespace(game_possession=SimpleNamespace(game_id=7))],
    GameCommonItemPhoto: [SimpleNamespace(game_common_item=SimpleNamespace(game_id=7))],
    GameFactionPhoto: [SimpleNamespace(faction=SimpleNamespace(game_id=7))],
    GameDocumentPhoto: [SimpleNamespace(game_document=SimpleNamespace(game_id=7))],
    GameDocumentFile: [SimpleNamespace(game_document=SimpleNamespace(game_id=7))],
    TreasurePhoto: [SimpleNamespace(treasure=SimpleNamespace(game_id=game_id))
                    for game_id in (7, None)],
    SourcePhoto: [SimpleNamespace()],
    StlModelPhoto: [SimpleNamespace()],
    CollectionPhoto: [SimpleNamespace()],
}


class TestScopeRules:
    """Tests for the `_SCOPE_RULES` map."""

    def test_every_finalize_type_has_a_rule(self):
        """Test that every finalize handler type, plus `GamePhoto`, has a scope rule."""
        assert sorted(set(_PHOTO_HANDLERS) | {GamePhoto}, key=str) == sorted(_SCOPE_RULES, key=str)

    @pytest.mark.parametrize(
        'model, stand_in',
        [(model, stand_in) for model, stand_ins in _STAND_INS.items() for stand_in in stand_ins],
    )
    def test_rule_scopes_are_in_the_catalogue(self, model, stand_in):
        """Test that each rule returns write scopes taken from the catalogue."""
        scopes, _ = _SCOPE_RULES[model](stand_in)
        assert scopes
        assert scopes <= set(SCOPES)

    def test_write_rejects_an_unknown_family(self):
        """Test that building a rule's scopes from an unknown family raises."""
        with pytest.raises(ValueError):
            upload_token_scope_check._write('dragons')


@pytest.mark.django_db
class TestUploadTokenScopeCheck:
    """Tests for `UploadTokenScopeCheck.run`."""

    def setup_method(self):
        """Set up a game, a user and a document file photo attached to no file."""
        self.game = GameFactory(name='Epic Quest', game_slug='epic-quest')
        self.user = UserFactory(username='owner')
        self.photo = GameDocumentFilePhoto.objects.create()

    def _check(self, scopes, content_object=None, games=None, origin=Upload.ORIGIN_REGULAR):
        """Run the check for an upload of `content_object` with a scoped token of `scopes`."""
        api_token, _ = ApiToken.objects.create_token(self.user, 'automation', scopes, games)
        upload = Upload.objects.create(
            user=self.user, file_path='photos/x.jpg',
            content_object=content_object or self.photo, origin=origin,
        )
        UploadTokenScopeCheck(SimpleNamespace(auth=api_token), upload).run()

    def _attach_file(self):
        """Attach the fixture photo to a file of a document of the fixture game."""
        document = GameDocumentFactory(game=self.game)
        GameDocumentFile.objects.create(game_document=document, photo=self.photo)

    def test_non_api_token_request_passes(self):
        """Test that a request not authenticated by a scoped token is not checked."""
        upload = Upload.objects.create(
            user=self.user, file_path='photos/x.jpg', content_object=self.photo,
            origin=Upload.ORIGIN_STAFF,
        )
        UploadTokenScopeCheck(SimpleNamespace(auth=None), upload).run()

    def test_unattached_document_file_photo_fails_closed(self):
        """Test that a document file photo with no file gives `token_not_allowed`."""
        with pytest.raises(ApiTokenNotAllowed):
            self._check(['documents:write'])

    def test_attached_document_file_photo_passes(self):
        """Test that a document file photo resolves its game through its file."""
        self._attach_file()
        self._check(['documents:write'], games=[self.game])

    def test_attached_document_file_photo_needs_the_scope(self):
        """Test that a document file photo without `documents:write` gives `scope_missing`."""
        self._attach_file()
        with pytest.raises(ScopeMissing):
            self._check(['games:write'])

    def test_attached_document_file_photo_checks_the_game(self):
        """Test that a document file photo off the token's games gives `game_not_allowed`."""
        self._attach_file()
        other = GameFactory(name='Other', game_slug='other')
        with pytest.raises(GameNotAllowed):
            self._check(['documents:write'], games=[other])

    def test_staff_origin_fails_closed(self):
        """Test that a staff-origin upload gives `token_not_allowed`."""
        self._attach_file()
        with pytest.raises(ApiTokenNotAllowed):
            self._check(list(SCOPES), origin=Upload.ORIGIN_STAFF)

    def test_unknown_content_type_fails_closed(self):
        """Test that a content object type missing from the map gives `token_not_allowed`."""
        with pytest.raises(ApiTokenNotAllowed):
            self._check(list(SCOPES), content_object=self.game)
