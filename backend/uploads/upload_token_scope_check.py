"""Scoped API token check for the upload finalize endpoint.

`upload_finalize` has no resource and no `game_slug` in its URL, so `TokenScopeCheck` cannot
enforce it: the view declares `@token_scopes(PATCH=[])` and runs this check instead. The scopes
and game come from the upload's content object, through `_SCOPE_RULES`, and mirror the init
route that created the upload.
"""

from accounts.authentication import ApiTokenNotAllowed, ScopeMissing
from accounts.models import ApiToken
from accounts.scopes import SCOPES, WRITE, effective_scopes
from accounts.token_games import check_token_game
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
from miniatures.models import CollectionPhoto, SourcePhoto, StlModelPhoto


def _write(*families):
    """Return the `<family>:write` scopes for `families`, all taken from the catalogue."""
    scopes = frozenset(f'{family}:{WRITE}' for family in families)
    unknown = scopes - frozenset(SCOPES)
    if unknown:
        raise ValueError(f'unknown scopes: {sorted(unknown)}')
    return scopes


_GAMES = _write('games')
_PCS = _write('pcs')
_NPCS = _write('npcs')
_PC_ITEMS = _write('pcs', 'items')
_NPC_ITEMS = _write('npcs', 'items')
_ITEMS = _write('items')
_POSSESSIONS = _write('possessions')
_COMMON_ITEMS = _write('common_items')
_FACTIONS = _write('factions')
_DOCUMENTS = _write('documents')
_TREASURES = _write('treasures')
_MINIATURES = _write('miniatures')


def _game_photo_rule(photo):
    """Return the scopes and game id of a `GamePhoto`."""
    return _GAMES, photo.game_id


def _character_photo_rule(photo):
    """Return the scopes and game id of a `CharacterPhoto` (NPC or PC family)."""
    character = photo.character
    return (_NPCS if character.npc else _PCS), character.game_id


def _character_item_photo_rule(photo):
    """Return the scopes and game id of a `CharacterItemPhoto` (character family + items)."""
    character = photo.character_item.character
    return (_NPC_ITEMS if character.npc else _PC_ITEMS), character.game_id


def _game_item_photo_rule(photo):
    """Return the scopes and game id of a `GameItemPhoto`."""
    return _ITEMS, photo.game_item.game_id


def _game_possession_photo_rule(photo):
    """Return the scopes and game id of a `GamePossessionPhoto`."""
    return _POSSESSIONS, photo.game_possession.game_id


def _game_common_item_photo_rule(photo):
    """Return the scopes and game id of a `GameCommonItemPhoto`."""
    return _COMMON_ITEMS, photo.game_common_item.game_id


def _game_faction_photo_rule(photo):
    """Return the scopes and game id of a `GameFactionPhoto`."""
    return _FACTIONS, photo.faction.game_id


def _game_document_rule(content_object):
    """Return the scopes and game id of a `GameDocumentPhoto` or `GameDocumentFile`."""
    return _DOCUMENTS, content_object.game_document.game_id


def _game_document_file_photo_rule(photo):
    """Return the scopes and game id of a `GameDocumentFilePhoto`, found through its file.

    Raises `GameDocumentFile.DoesNotExist` / `MultipleObjectsReturned` when the photo is not
    attached to exactly one file.
    """
    return _DOCUMENTS, GameDocumentFile.objects.get(photo=photo).game_document.game_id


def _treasure_photo_rule(photo):
    """Return the scopes and game id (None for a catalogue treasure) of a `TreasurePhoto`."""
    return _TREASURES, photo.treasure.game_id


def _miniatures_photo_rule(photo):
    """Return the scopes of a miniatures photo, which belongs to no game."""
    return _MINIATURES, None


# Maps each upload content-object type to a `content_object -> (required_scopes, game_id)` rule.
# Each entry mirrors the `@token_scopes` declaration of the init route that created the upload.
_SCOPE_RULES = {
    GamePhoto: _game_photo_rule,
    CharacterPhoto: _character_photo_rule,
    CharacterItemPhoto: _character_item_photo_rule,
    GameItemPhoto: _game_item_photo_rule,
    GamePossessionPhoto: _game_possession_photo_rule,
    GameCommonItemPhoto: _game_common_item_photo_rule,
    GameFactionPhoto: _game_faction_photo_rule,
    GameDocumentPhoto: _game_document_rule,
    GameDocumentFile: _game_document_rule,
    GameDocumentFilePhoto: _game_document_file_photo_rule,
    TreasurePhoto: _treasure_photo_rule,
    SourcePhoto: _miniatures_photo_rule,
    StlModelPhoto: _miniatures_photo_rule,
    CollectionPhoto: _miniatures_photo_rule,
}

_RESOLUTION_ERRORS = (
    GameDocumentFile.DoesNotExist,
    GameDocumentFile.MultipleObjectsReturned,
)


class UploadTokenScopeCheck:
    """Decide whether a scoped API token may finalize `upload`.

    Session and legacy `Token` requests always pass. Staff- and copy-origin uploads, unknown
    content-object types and unresolvable content objects fail with `token_not_allowed`;
    otherwise the token needs the rule's scopes (`scope_missing`) and, when the content
    object belongs to a game, that game on its list (`game_not_allowed`).
    """

    def __init__(self, request, upload):
        """Keep the request and the upload being finalized."""
        self._request = request
        self._upload = upload

    def run(self):
        """Raise the matching `ApiTokenForbidden` subclass unless the request may proceed."""
        api_token = getattr(self._request, 'auth', None)
        if not isinstance(api_token, ApiToken):
            return
        required_scopes, game_id = self._resolve()
        if not required_scopes <= effective_scopes(api_token):
            raise ScopeMissing()
        check_token_game(self._request, game_id)

    def _resolve(self):
        """Return the upload's `(required_scopes, game_id)`, or raise `token_not_allowed`."""
        if self._upload.is_staff_origin or self._upload.is_copy_origin:
            raise ApiTokenNotAllowed()
        content_object = self._upload.content_object
        rule = _SCOPE_RULES.get(type(content_object))
        if rule is None:
            raise ApiTokenNotAllowed()
        return self._apply(rule, content_object)

    def _apply(self, rule, content_object):
        """Run `rule` on `content_object`, turning a lookup failure into `token_not_allowed`."""
        try:
            return rule(content_object)
        except _RESOLUTION_ERRORS:
            raise ApiTokenNotAllowed() from None
