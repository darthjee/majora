# Unused Backend Endpoints

Backend routes that are registered and working, but not currently called anywhere by the
frontend. An endpoint ends up here either because it was built ahead of its frontend
integration (deliberately, as part of a staged initiative), or because the feature that
used to call it was replaced and the endpoint was left behind.

This list exists so these endpoints stay traceable to their originating initiative instead
of silently looking like dead code. It is **script-assisted, human-curated**: the detection
command below only produces candidates — the *Initiative* and *Why unused* columns are
written by hand after reviewing each candidate.

Navi (the cache-warmer) calling an endpoint per `navi/navi_config.yaml` does not count as
usage for this list — only real frontend calls do.

## Candidates

| Endpoint | Module/App | Initiative | Why unused |
|----------|------------|------------|------------|
| `PATCH /uploads/(image\|file)/<id>.json` | `uploads` (`uploads.views.upload_finalize`) | Long-standing, predates focused issue tracking | The upload lifecycle's finalize/status-transition step. `UploadClient` (frontend) only performs the init (`POST .../photo_upload.json`) and submit (`POST /uploads/<type>/<id>/submit`, handled by the PHP proxy for multipart) steps — the JSON endpoint that advances the upload's status and marks the linked photo/file "ready" is never called from the frontend. |
| `PATCH /games/<slug>/documents/<id>/photos/<id>/set.json` | `games` (`games.views.games.game_document_photo_set`) | #727 / #854 ("Add documents photo upload") | Sets a `GameDocument`'s display photo. `gameDocumentPhotoConfig.js` only wires the `GET` (list) side; the equivalent "set as display photo" action was wired for character documents (`pcConfig.js`/`npcConfig.js`) but never for game-level documents. |
| `GET /games/<slug>/npcs/<id>/access.json` | `games` (`games.views.game._character_shared`) | #690 / #692 ("Refactor backend: 10 code-quality improvements") | Part of the generic PC/NPC route set applied uniformly for symmetry. The frontend calls the game-level and treasure-level `access.json` (`GameClient`, `TreasureClient`) but never the character-scoped one — character edit permission appears to be derived once at the game level rather than re-checked per character. |
| `GET /games/<slug>/npcs/<id>/photos/<id>/deletable.json` | `games` (`games.views.game._character_shared`) | #690 / #692 ("Refactor backend: 10 code-quality improvements") | Same generic PC/NPC route set as the row above; no frontend flow queries per-photo deletability before allowing a delete. |
| `GET /games/<slug>/pcs/<id>/access.json` | `games` (`games.views.game._character_shared`) | #690 / #692 ("Refactor backend: 10 code-quality improvements") | PC counterpart of the NPC `access.json` row above — same generic route set, same gap. |
| `GET /games/<slug>/pcs/<id>/photos/<id>/deletable.json` | `games` (`games.views.game._character_shared`) | #690 / #692 ("Refactor backend: 10 code-quality improvements") | PC counterpart of the NPC `deletable.json` row above — same generic route set, same gap. |
| `GET /games/<slug>/photos.json` | `games` (`games.views.games.game_photos`) | Long-standing, predates focused issue tracking | Aggregate "all ready photos across the game" gallery endpoint. No frontend view lists a game's photos across all characters/items in one place; only character-scoped photo lists are used today. |
| `GET /miniatures/stl_models.json` | `miniatures` (`miniatures.views.stl_models_list`) | #1017 / #1021 ("Add stl search system") | First issue of a staged initiative: introduces the `miniatures` app's read-only list/detail endpoints on purpose, with no frontend UI yet and search/filtering explicitly deferred to a follow-up issue. |
| `GET /miniatures/stl_models/<id>.json` | `miniatures` (`miniatures.views.stl_model_detail`) | #1017 / #1021 ("Add stl search system") | Detail counterpart of the row above — same staged, backend-only initiative. |

## How to regenerate

The candidate list above is produced by a Django management command that cross-references
every registered backend route against the frontend's two calling conventions (hardcoded
paths in `frontend/assets/js/client/*.js`, and config-driven paths in
`frontend/assets/js/utils/requests/resourceConfig.js` and `.../config/*.js`). Re-run it to
refresh the candidates, then hand-review any new entries before adding them above:

```bash
docker-compose run --rm -v "$(pwd)/frontend:/home/app/frontend:ro" majora_tests python manage.py list_unused_endpoints
```

The command reads frontend source as plain text from a `frontend/` sibling of the backend
app root (`/home/app/app/../frontend` inside the container, overridable with
`--frontend-root`); the extra `-v` mount above is required because the `majora_tests`
service (like every other backend service in `docker-compose.yml`) only mounts `./backend`
by default.

Note the command's output is candidates only — it does not know about frontend calls made
through other conventions (e.g. `client.fetchIndex()` with a literal path passed directly
from a `list_types/configs/*.js` file), so a small number of false positives should be
expected and filtered out by hand.
