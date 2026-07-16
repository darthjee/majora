# Plan: Fix descriptions

Issue: [552-fix-descriptions.md](../../issues/552-fix-descriptions.md)

## Overview

Extract a new shared `DescriptionBox` component (`frontend/assets/js/components/common/`) that
renders a bordered, `text-pre-wrap` box with a max-height + "Show more"/"Show less" toggle, and
reuse it for all five description fields (`game.description`, `pc`/`npc` `public_description`,
`pc`/`npc` `private_description`). Switch the game New/Edit forms from a single-line `FormField`
to the existing `TextareaField` component, matching how `pc`/`npc` description fields already
work. Add the new `show_more`/`show_less` translation keys the component needs.

## Agents involved

- [frontend](frontend.md)
- [translator](translator.md)

## Shared contracts

The frontend agent's `DescriptionBox` component calls `Translator.t('description_box.show_more')`
and `Translator.t('description_box.show_less')` (new top-level `description_box:` i18n namespace,
not nested under an existing page key since the component is shared across `game_page` and
`character_full_page`). The translator agent must add exactly these two keys, with these exact
values, to **both** `frontend/assets/i18n/en.yaml` and `frontend/assets/i18n/pt.yaml`:

- `description_box.show_more` — English: `Show more`
- `description_box.show_less` — English: `Show less`

(Portuguese wording is the translator agent's call — keep it consistent with how other short
action labels are translated elsewhere in `pt.yaml`, e.g. `back_button`, `pagination`.)

No other contract crosses the agent boundary — the frontend agent can start building
`DescriptionBox` immediately using these key names before the translator agent's change lands,
since `Translator.t()` falls back gracefully for missing keys during local dev (verify against
`check_i18n` in CI regardless — see `frontend.md`'s CI Checks).
