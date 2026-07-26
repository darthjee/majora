# Issue: Refactor public slain and allegiance

## Description

Characters (PCs and NPCs) currently have three attributes that live in a public/private duality:

- `description` — `public_description` / `private_description`
- `slain` — `public_slain` / `slain`
- `allegiance` — `public_allegiance` / `allegiance`

We have separate endpoints for private and public information for both PCs and NPCs (list, show, and update).

For `slain` and `allegiance`, the public serializer exposes `public_slain` and `public_allegiance` as `slain` and `allegiance` — a transformation that isn't applied to `description`. Similarly, the public patch endpoints take `slain` and `allegiance` in the payload and use them to patch `public_slain` and `public_allegiance`, and index endpoint filters named `slain`/`allegiance` filter on the `public_slain`/`public_allegiance` columns.

This duality exists because, for attributes like `description`, only the DM or owner should have access to the private value. For `slain` and `allegiance`, the idea is that players register what they believe to be the truth, while the DM knows the actual truth.

## Problem

- **Transformation in the serializer**: the transformation from `public_slain` into `slain` and `public_allegiance` into `allegiance` on public read endpoints creates unnecessary code and logic complexity.
- **Public update**: the transformation from `allegiance` into `public_allegiance` and `slain` into `public_slain` on update creates unnecessary complexity and is bug-prone (e.g. when `slain`/`public_slain` or `allegiance`/`public_allegiance` are both sent in the same payload).
- **Component visibility**: because of the transformation, it's hard to write clear UI code where users without full access see just one select for allegiance — they currently see both a `public_allegiance` and an `allegiance` select on the character form, even though both refer to the same concept from their perspective.
- **Lack of consistency**: `description` clearly names its public/private variants, but `slain` and `allegiance` don't, making it hard to tell what's being looked at in the endpoint or database.

## Solution

- Rename the `slain` attribute to `private_slain`.
- Rename the `allegiance` attribute to `private_allegiance`.
- Remove the transformation from the public show and index endpoints.
- Remove the transformation from the public endpoints (both persistence and serializer).
- Change translation keys to match the new attribute names (text stays the same).
- Fix and add filters (for DM and admin only) on the NPC index page.
- Ensure the data wrapper fetches the correct allegiance for the border color effect on the NPC list.

### Database migration

Create a migration that renames:
- Column `slain` → `private_slain`
- Column `allegiance` → `private_allegiance`

The migration should be reversible and preserve all existing data.

### Rename of attributes and removal of transformation

Renaming affects the serializer, the key used by frontend components, and the translation key — but not the translation text.

### Serializer response keys

**Public endpoints**: `public_slain`, `public_allegiance`

**Private endpoints**: `public_slain`, `public_allegiance`, `private_slain`, `private_allegiance`

**No longer present anywhere**: `slain`, `allegiance`

### Data wrapper on list components

- **NPC list page and PC list page**: both use a shared list component that fetches data and wraps each entry with a class responsible for exposing attributes, custom attributes, or custom transformations (e.g. exposing photo URL through a common interface).
- **Game show page PC/NPC shortlists**: the shortlist component also wraps each entry with a similar class.
- **Common behavior**: this wrapper is used to derive the allegiance shown for the border color, and whether an NPC is slain for the black-and-white photo treatment. In both cases, the private value takes priority and the public value is the fallback when the private value is absent.

Pseudo-code:

```javascript
// Pseudo-code
class CharacterDataWrapper {
  getSlain() {
    // private_slain takes priority, fall back to public_slain
    return this.data.private_slain !== undefined
      ? this.data.private_slain
      : this.data.public_slain;
  }

  getAllegiance() {
    // private_allegiance takes priority, fall back to public_allegiance
    return this.data.private_allegiance !== undefined
      ? this.data.private_allegiance
      : this.data.public_allegiance;
  }
}
```

### Mark as Slain / Revive buttons

**For DMs and admins** — show two separate buttons (currently a single button):
- One for `private_slain` (labeled "Mark as Slain" / "Revive"):
  - "Mark as Slain" shown if `private_slain` is false, with the `skull-fill` icon.
  - "Revive" shown if `private_slain` is true, with the `heart-fill` bootstrap icon.
- One for `public_slain` (labeled "Mark as Slain (Perceived)" / "Revive (Perceived)"):
  - "Mark as Slain (Perceived)" shown if `public_slain` is false, with the `skull-lines` icon.
  - "Revive (Perceived)" shown if `public_slain` is true, with the `heart` bootstrap icon.
- Each button sends the appropriate payload to its respective endpoint.

**For players and staff** — show a single button based on `public_slain` (same text as today: "Mark as Slain" / "Revive", `skull-fill` / `heart-fill` icons), sending only to the public endpoint.

### Allegiance selects in the forms

- **DMs and admins**: see both selects, for public and private allegiance.
- **Players and staff**: see only the select for `public_allegiance`.

### Filters on the NPC index page

- **DMs and admins**: separate filters for `public_allegiance`, `private_allegiance`, `private_slain`, `public_slain`.
- **Players and staff**: separate filters for the public values only — `public_allegiance`, `public_slain`.

### Filters on the NPC index endpoint

`GET /games/:game_slug/npcs.json`:
- Ignores filters on `private_slain` and `private_allegiance`.
- Filters `public_slain` by the `public_slain` filter (no transformation).
- Filters `public_allegiance` by the `public_allegiance` filter (no transformation).

### Important

- Public endpoints must not expose `private_*` attributes.
- Public mutation endpoints must not change `private_*` attributes.

### Affected entities

Both PC and NPC (`Character`).

### Affected endpoints

**PC public endpoints**
- `GET /games/:game_slug/pcs.json`
- `GET /games/:game_slug/pcs/:character_id.json`

**NPC public endpoints**
- `GET /games/:game_slug/npcs.json`
- `GET /games/:game_slug/npcs/:character_id.json`
- `PATCH /games/:game_slug/npcs/:character_id.json`

**PC private endpoints**
- `GET /games/:game_slug/pcs/:character_id/full.json`
- `PATCH /games/:game_slug/pcs/:character_id.json`
- `PATCH /games/:game_slug/pcs/:character_id/full.json`

**NPC private endpoints**
- `GET /games/:game_slug/npcs/all.json`
- `GET /games/:game_slug/npcs/:character_id/full.json`
- `POST /games/:game_slug/npcs.json`
- `PATCH /games/:game_slug/npcs/:character_id/full.json`
- `PATCH /games/:game_slug/npcs/:character_id/slain.json`

### Affected routes

**PC routes**
- `/#/games/:game_slug/pcs`
- `/#/games/:game_slug/pcs/:character_id`
- `/#/games/:game_slug/pcs/:character_id/edit`

**NPC routes**
- `/#/games/:game_slug/npcs`
- `/#/games/:game_slug/npcs/new`
- `/#/games/:game_slug/npcs/:character_id`
- `/#/games/:game_slug/npcs/:character_id/edit`

**Game show page**
- `/#/games/:game_slug`

### What this issue is not about

**Permissions**
- No changes to endpoint permissions: private endpoints remain DM/admin/owner only; public patch and post endpoints remain DM, admin, staff, and player accessible; public get endpoints remain open to everyone.
- No changes to route access.
- No changes to component access, with the exception of:
  - Filters in the NPC list page.
  - The allegiance / public_allegiance / private_allegiance selects in NPC forms.

**Translation**
- Translation keys may change, but the translated text stays the same.

## Benefits

- Removes transformation logic from the public serializer and public patch endpoints, eliminating a source of bugs (e.g. conflicting `slain`/`public_slain` or `allegiance`/`public_allegiance` payloads).
- Makes the database and API self-documenting: field names consistently indicate whether they hold public or private data, matching the existing `description` convention.
- Enables correct, unambiguous UI: players/staff and DMs/admins each see only the selects and filters relevant to their access level, instead of two selects that appear to represent the same thing.
