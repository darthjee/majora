# Add the upload token scope check

Create `backend/uploads/upload_token_scope_check.py` with an `UploadTokenScopeCheck` class, in the style of `CopyLinkFinalizer` / `StaffUploadFinalizer` (small class, one public method, docstrings on everything).

- `UploadTokenScopeCheck(request, upload).run()` returns at once unless `request.auth` is an `accounts.models.ApiToken`. Session and legacy `Token` requests are unaffected.
- Staff- or copy-origin upload → raise `ApiTokenNotAllowed` (`token_not_allowed`).
- Look up `type(upload.content_object)` in a module-level `_SCOPE_RULES` map. Each entry is a function `content_object -> (required_scopes, game_id)`:

  | Model | Scopes | Game id |
  |---|---|---|
  | `GamePhoto` | `games:write` | `photo.game_id` |
  | `CharacterPhoto` | `npcs:write` if `character.npc` else `pcs:write` | `character.game_id` |
  | `CharacterItemPhoto` | character family `:write` + `items:write` | `character_item.character.game_id` |
  | `GameItemPhoto` | `items:write` | `game_item.game_id` |
  | `GamePossessionPhoto` | `possessions:write` | `game_possession.game_id` |
  | `GameCommonItemPhoto` | `common_items:write` | `game_common_item.game_id` |
  | `GameFactionPhoto` | `factions:write` | `faction.game_id` |
  | `GameDocumentPhoto`, `GameDocumentFile` | `documents:write` | `game_document.game_id` |
  | `GameDocumentFilePhoto` | `documents:write` | via `GameDocumentFile.objects.get(photo=...)` |
  | `TreasurePhoto` | `treasures:write` | `treasure.game_id` (may be `None`) |
  | `SourcePhoto`, `StlModelPhoto`, `CollectionPhoto` | `miniatures:write` | `None` |

  Check each FK attribute name against the model while implementing.
- A model missing from the map, or a resolution failure (e.g. no matching `GameDocumentFile`) → `ApiTokenNotAllowed`.
- If the required scopes are not a subset of `effective_scopes(api_token)` → `ScopeMissing`. Then `check_token_game(request, game_id)` raises `GameNotAllowed` (same order as `TokenScopeCheck`: scopes before game).
- The scope strings must come from the catalogue (e.g. build them with `f'{family}:{WRITE}'`, or assert they are in `SCOPES`), so a typo cannot silently fail closed forever.

## Files to Change
- `backend/uploads/upload_token_scope_check.py` — new: `UploadTokenScopeCheck` and `_SCOPE_RULES`.
