# Refactor public slain and allegiance

## Current Scenario

Characters have attributes that live in duality:
- `description`: `public_description` + `private_description`
- `slain`: `public_slain` + `slain` (real value)
- `allegiance`: `public_allegiance` + `allegiance` (real value)

Currently, PCs and NPCs have separated endpoints for private and public information (list, show, and update).

## The Problem

### Transformation Complexity
The serializers currently transform `public_slain` → `slain` and `public_allegiance` → `allegiance` on public endpoints, creating unnecessary code complexity and logic duplication.

### Update Bug Risk
When updating via public endpoints, the transformation from `allegiance` → `public_allegiance` and `slain` → `public_slain` is error-prone, especially when both real and public values are sent in the same payload.

### Component Visibility Confusion
Because of the serializer transformation, components can't clearly distinguish between public and real values. Frontend code ends up showing both `public_allegiance` and `allegiance` dropdowns for the same attribute.

### Naming Inconsistency
Unlike `description` (which clearly has `public_description` and `private_description`), the attributes `slain` and `allegiance` don't indicate which is the real value and which is public, making code harder to understand.

## Solution Overview

Rename the database columns and update the entire stack (backend + frontend) to use explicit naming:
- `slain` → `private_slain` (the real value)
- `allegiance` → `private_allegiance` (the real value)
- Keep `public_slain` and `public_allegiance` as they are

This removes the need for serializer transformations and makes the code self-documenting.

## Affected Entities

Both `Character` model instances:
- PCs (when `npc=False`)
- NPCs (when `npc=True`)

## Implementation Details

### 1. Database Migration

Create a migration that renames:
- Column `slain` → `private_slain`
- Column `allegiance` → `private_allegiance`

The migration should:
- Run on both `Character` instances (PCs and NPCs)
- Be reversible
- Preserve all existing data

### 2. Backend Serializers

#### CharacterDetailSerializer (public detail endpoint)
Currently exposes:
```python
slain = serializers.BooleanField(source='public_slain', read_only=True)
allegiance = serializers.CharField(source='public_allegiance', read_only=True)
```

**After refactor:** No transformation needed
```python
public_slain = serializers.BooleanField(read_only=True)
public_allegiance = serializers.CharField(read_only=True)
```

The response key will be `public_slain`/`public_allegiance` (no `slain`/`allegiance` keys).

#### CharacterFullSerializer (private detail endpoint)
Currently exposes both `slain`, `public_slain`, `allegiance`, `public_allegiance`.

**After refactor:** Expose all four fields with no transformation
```python
private_slain = serializers.BooleanField(read_only=True)
public_slain = serializers.BooleanField(read_only=True)
private_allegiance = serializers.CharField(read_only=True)
public_allegiance = serializers.CharField(read_only=True)
```

#### CharacterListSerializer (public list endpoint)
**After refactor:** Similar to CharacterDetailSerializer, use explicit field names.

#### CharacterFullListSerializer (private list endpoint - NPCs only)
**After refactor:** Expose all four fields with explicit naming.

#### CharacterUpdateSerializer (write operations)
**Backward compatibility rule:** Accept `slain` and `allegiance` in request payloads but ignore them. Only accept `private_slain`, `public_slain`, `private_allegiance`, `public_allegiance`.

### 3. Backend Filtering (GET Endpoints)

#### `GET /games/:game_slug/npcs.json` (public list)
Query parameters:
- `?slain=true|false` → filter on `public_slain` (no transformation)
- `?allegiance=ally|enemy|neutral` → filter on `public_allegiance` (no transformation)
- **Important:** Ignore/reject any filters for `private_slain` or `private_allegiance`

#### `GET /games/:game_slug/npcs/all.json` (DM/admin list)
Query parameters:
- `?slain=true|false` → filter on `private_slain` (the real value)
- `?allegiance=ally|enemy|neutral` → filter on `private_allegiance` (the real value)
- Optionally support filtering by public values if explicitly requested

### 4. Frontend: Data Wrapper Enhancement

Enhance existing data wrapper classes (or create if needed) to expose a unified interface with fallback logic:

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

This wrapper should be used by:
- NPC list page (`GameNpcs.jsx`)
- PC list page (`GamePcs.jsx`)
- Game show page shortlist components

### 5. Frontend: Photo Display (Black & White)

The photo black & white logic already exists and uses a `slain` property. Update it to use the wrapper's `getSlain()` method:
- If `getSlain()` returns `true` → show photo in black & white
- Otherwise → show photo in color

### 6. Frontend: Border Color (Allegiance)

The allegiance border color logic already exists and uses an `allegiance` property. Update it to use the wrapper's `getAllegiance()` method:
- The border color is determined by `getAllegiance()` return value
- `'ally'` → green border
- `'enemy'` → red border
- `'neutral'` → gray border (or none)

### 7. Frontend: UI Elements for DMs/Admins vs Players

#### Mark as Slain / Revive Buttons

**For DMs and Admins:**
- Show two separate buttons (currently single buttons):
  - One for `private_slain` (labeled: "Mark as Slain (True)" / "Revive (True)")
  - One for `public_slain` (labeled: "Mark as Slain (Perceived)" / "Revive (Perceived)")
- Each button sends the appropriate payload to the respective endpoint

**For Players and Staff:**
- Show a single button based on `public_slain`:
  - "Mark as Slain" or "Revive" (same text as today)
- Only sends to the public endpoint

#### Allegiance Selects in Forms

**For DMs and Admins:**
- Show two separate select dropdowns:
  - One for `private_allegiance` (labeled: "Real Allegiance")
  - One for `public_allegiance` (labeled: "Perceived Allegiance")

**For Players and Staff:**
- Show a single select dropdown for `public_allegiance` (labeled: "Allegiance")

### 8. Frontend: NPC Filters

The NPC filters component (`NpcFilters.jsx`) should check `canEdit` permission and conditionally render:

**For DMs and Admins (canEdit=true):**
- Filter for `private_slain` (Status: Alive/Slain)
- Filter for `private_allegiance` (Allegiance: Ally/Enemy/Neutral)
- Filter for `public_slain` (Public Status: Alive/Slain)
- Filter for `public_allegiance` (Public Allegiance: Ally/Enemy/Neutral)

**For Players and Staff (canEdit=false):**
- Filter for `public_slain` (Status: Alive/Slain)
- Filter for `public_allegiance` (Allegiance: Ally/Enemy/Neutral)

The query parameters sent should match the filter names exactly (no transformation).

### 9. Translation Keys

Translation keys will change to match the new attribute names:
- `character.slain` → `character.private_slain`
- `character.allegiance` → `character.private_allegiance`
- Add new keys: `character.public_slain`, `character.public_allegiance`

**Important:** The displayed text does NOT change. Only the keys change. For example:
- Before: `translations['character.slain'] = "Slain"`
- After: `translations['character.private_slain'] = "Slain"` (same text)

## Affected Endpoints

### PC Public Endpoints
- `GET /games/:game_slug/pcs.json`
- `GET /games/:game_slug/pcs/:character_id.json`

**Note:** PC `slain` and `allegiance` are NPC-focused concerns and should not appear in PC forms or filters. PCs will still expose `public_slain` and `public_allegiance` in responses but will not have UI elements for managing them.

### NPC Public Endpoints
- `GET /games/:game_slug/npcs.json` (will filter on `public_slain` and `public_allegiance`)
- `GET /games/:game_slug/npcs/:character_id.json`
- `PATCH /games/:game_slug/npcs/:character_id.json` (will only update public values)

### PC Private Endpoints
- `GET /games/:game_slug/pcs/:character_id/full.json`
- `PATCH /games/:game_slug/pcs/:character_id.json` (will accept but ignore `slain`/`allegiance` for backward compatibility)
- `PATCH /games/:game_slug/pcs/:character_id/full.json` (will accept but ignore `slain`/`allegiance` for backward compatibility)

### NPC Private Endpoints
- `GET /games/:game_slug/npcs/all.json` (will filter on `private_slain` and `private_allegiance`)
- `GET /games/:game_slug/npcs/:character_id/full.json`
- `POST /games/:game_slug/npcs.json`
- `PATCH /games/:game_slug/npcs/:character_id/full.json`
- `PATCH /games/:game_slug/npcs/:character_id/slain.json` (will need to accept both `private_slain` and `public_slain`)

## Affected Routes

### PC Routes
- `/#/games/:game_slug/pcs`
- `/#/games/:game_slug/pcs/:character_id`
- `/#/games/:game_slug/pcs/:character_id/edit`

### NPC Routes
- `/#/games/:game_slug/npcs`
- `/#/games/:game_slug/npcs/new`
- `/#/games/:game_slug/npcs/:character_id`
- `/#/games/:game_slug/npcs/:character_id/edit`

### Game Show Page
- `/#/games/:game_slug` (contains short PC and NPC preview lists)

## What This Issue Is NOT About

### Permissions
- No changes to endpoint permissions
- Private endpoints remain DM/admin/owner only
- Public mutation endpoints remain DM/admin/staff/players only
- Public GET endpoints remain AllowAny

### Routes Access
- No changes to route access control

### Component Access
- No changes to component visibility, except:
  - Filters on NPC list page (will show different filters for DMs vs players)
  - Allegiance and slain selects in NPC forms (will show different selects for DMs vs players)

### Backward Compatibility
- PC update endpoints will continue to accept `slain` and `allegiance` in payloads but will ignore them
- This allows client code to not change immediately

## Implementation Checklist

- [ ] Create database migration for column renames
- [ ] Update Character model (if needed) to reflect new field names
- [ ] Update all serializers (CharacterDetailSerializer, CharacterFullSerializer, etc.)
- [ ] Update filtering logic in views for both public and private NPC endpoints
- [ ] Create/enhance data wrapper classes for frontend
- [ ] Update photo display logic to use wrapper's `getSlain()`
- [ ] Update border color logic to use wrapper's `getAllegiance()`
- [ ] Update mark as slain/revive buttons to show conditionally for DMs vs players
- [ ] Update allegiance form selects to show conditionally for DMs vs players
- [ ] Update NPC filters component to render conditionally based on `canEdit`
- [ ] Update translation keys (preserve text)
- [ ] Update tests to reflect new field names and behavior
- [ ] Update documentation in `docs/agents/access-control/character.md`

## Important Notes

- **Public endpoints must not expose `private_*` attributes**
- **Public mutation endpoints must not change `private_*` attributes**
- **Data wrapper fallback logic:** Use `private_*` if present, otherwise use `public_*`
- **Translation text stays the same, only keys change**
- **PC slain/allegiance are not exposed in UI (NPC-only concern)**
