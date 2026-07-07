# Plan: Add link icon

Issue: [359-add-link-icon.md](../issues/359-add-link-icon.md)

## Overview
Add a `link_type` field to both the `Link` and `CharacterLink` models (backend), expose it through their serializers, and use it in the shared `LinkList` component (frontend) to render a type-specific icon image instead of the generic chain icon. Also reorganize `frontend/assets/images/` into `placeholders/`, `links/`, and `icons/` subfolders, updating the three components that import placeholder images directly, and add a placeholder `lootstudio.png` icon.

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)

## Shared contracts

- `Link` and `CharacterLink` API responses (returned as part of the `links` array on `/games/<slug>.json` and character detail endpoints) gain a new field: `link_type` (string, nullable/blank, default `''`/unset).
- Allowed values start with a single constant: `lootstudio`. Follow the existing `CharField` + module-level constants + `CHOICES` list convention used by `Upload.STATUS_CHOICES` (`source/games/models/upload.py`) — do **not** use `models.TextChoices`.
- Frontend contract: when `link.link_type` is falsy/unset, `LinkList` renders the existing `bi-link-45deg` Bootstrap icon (unchanged fallback behavior). When `link.link_type` is `'lootstudio'` (or any other future recognized value), it renders `frontend/assets/images/links/<link_type>.png` instead.
- No new API endpoint is introduced and no existing endpoint URL changes, so no Navi cache-warmer config changes are required.
