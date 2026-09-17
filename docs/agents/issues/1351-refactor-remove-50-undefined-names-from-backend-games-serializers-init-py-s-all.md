# Refactor: remove 50 undefined names from backend/games/serializers/__init__.py's __all__

## Context

Codacy's Pylint scan (`E0603`, ErrorProne, High severity) flags 50 entries in `backend/games/serializers/__init__.py`'s `__all__` list as undefined names — e.g. `BaseAccessSerializer`, `GameCreateSerializer`, `CharacterFullSerializer`, and 47 others (full list below). This means `__all__` references symbols that aren't actually imported/defined in that module, which silently breaks `from games.serializers import *` for those names and hides real import errors instead of raising them.

## What needs to be done

Backend: audit `backend/games/serializers/__init__.py` and reconcile the `__all__` list against the module's actual imports — either import each currently-undefined serializer explicitly so the name resolves, or remove it from `__all__` if it no longer exists / was renamed. Re-run the Pylint scan (or `docker-compose run --rm majora_tests` lint step) to confirm zero `E0603` findings remain for this file.

Affected names (line: name):
- 30: BaseAccessSerializer
- 31: BasePermissionsSerializer
- 32: CharacterAccessSerializer
- 33: CharacterCreateSerializer
- 34: CharacterDetailSerializer
- 35: CharacterDocumentAllSerializer
- 36: CharacterDocumentFileSerializer
- 37: CharacterDocumentPhotoSerializer
- 38: CharacterDocumentSerializer
- 39: CharacterFactionAllSerializer
- 40: CharacterFactionSerializer
- 41: CharacterFullListSerializer
- 42: CharacterFullSerializer
- 43: CharacterItemAllSerializer
- 44: CharacterItemDetailFullSerializer
- 45: CharacterItemDetailSerializer
- 46: CharacterItemSerializer
- 47: CharacterItemUpdateSerializer
- 48: CharacterLinkSerializer
- 49: CharacterLinkWriteSerializer
- 50: CharacterListSerializer
- 51: CharacterPermissionsSerializer
- 52: CharacterPhotoSerializer
- 53: CharacterPossessionAllSerializer
- 54: CharacterPossessionSerializer
- 55: CharacterRegularUpdateSerializer
- 56: CharacterTreasureAllSerializer
- 57: CharacterTreasureSerializer
- 58: CharacterUpdateSerializer
- 59: ConversationListSerializer
- 60: FileUploadSerializer
- 61: GameAccessSerializer
- 62: GameCommonItemAllListSerializer
- 63: GameCommonItemDetailFullSerializer
- 64: GameCommonItemDetailSerializer
- 65: GameCommonItemListSerializer
- 66: GameCommonItemPermissionsSerializer
- 67: GameCommonItemUpdateSerializer
- 68: GameCreateSerializer
- 69: GameDetailSerializer
- 70: GameDocumentAllListSerializer
- 71: GameDocumentDetailFullSerializer
- 72: GameDocumentDetailSerializer
- 73: GameDocumentFileSerializer
- 74: GameDocumentListSerializer
- 75: GameDocumentPageCreateSerializer
- 76: GameDocumentPageListSerializer
- 77: GameDocumentPageUpdateSerializer
- 78: GameDocumentPagesBumpVersionSerializer
- 79: GameDocumentPagesTrimSerializer

## Acceptance criteria

- [ ] All 50 names Codacy lists as undefined in `__all__` are either imported so they resolve, or removed from the list
- [ ] `from games.serializers import *` no longer silently omits/breaks on any of these names
- [ ] Codacy's Pylint `E0603` finding count for this file drops to 0
