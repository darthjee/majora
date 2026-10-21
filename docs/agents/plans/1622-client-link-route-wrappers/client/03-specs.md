# Specs

Use the `specs/support/` fetch stub (`FetchStub.js`, `buildCore.js`, `variantExamples.js`),
following `DocumentPages_spec.js`.

- `CharacterItems_spec.js`, `CharacterDocuments_spec.js`, `CharacterFactions_spec.js` (or one
  shared spec per base plus small per-class specs): for both `npcs` and `pcs`, URL per action and
  variant, `POST` method and JSON body for `acquire`/`remove`, faction `remove(factionId)` URL,
  `available` returning a `Page` and `iterateAvailable` walking pages, blank character id and
  unsupported actions (`create`, `update`) throwing `UsageError` before any request.
- No retry on `acquire`/`remove` when the stub answers 5xx; `GET` still retried.
- The `LinkHandler` 422 body `{"status": "failed", "error": "<code>"}` surfaces as an `ApiError`
  with `codes`; no error message contains the token.
- `Factions_spec.js`, `Items_spec.js`, `Documents_spec.js`: `characters`/`iterateCharacters`
  and `summary` URLs per variant, invalid `kind` and blank ids → `UsageError`.
- `Npcs_spec.js`/`Pcs_spec.js`: the factory methods return the right class bound to the right path.

## Files to Change

- `client/specs/resources/CharacterItems_spec.js`, `CharacterDocuments_spec.js`, `CharacterFactions_spec.js` — new.
- `client/specs/resources/Factions_spec.js`, `Items_spec.js`, `Documents_spec.js`, `Npcs_spec.js`, `Pcs_spec.js` — extended.
