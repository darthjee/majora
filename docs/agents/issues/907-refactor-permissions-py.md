# Issue: Refactor permissions.py

## Description
`backend/games/permissions.py` has grown into a file that tries to do too much: it defines a separate class per action, which makes the permission logic convoluted and hard to follow. The classes do not clearly express the simple truths (roles, ownership, scope) they are meant to encode.

## Problem
- The file is too convoluted: one permission class per action, with logic scattered instead of centralized.
- The classes do not transmit the simple truths they should encode (who is a player, a dm, an owner, etc).
- Related caching in `backend/games/caches` stores role/permission data in a way that doesn't match a clean role model and needs redesigning alongside this refactor.

## Solution
Redesign the permissions objects around a small set of explicit principles.

### Principles

#### Global roles
Users have global roles that work across any game:
- `logged_user`: the user is logged in, regardless of being a player, dm, staff, owner, or admin.
- `admin`: the user is marked as super_user.
- `staff`: the user is marked as staff.

#### Game scoped roles
- `player`: the user is a player in the game.
- `dm`: the user is a dm in the game.

#### Game PC scoped roles
- `owner`: the user is the owner (connected player) of a PC character in the game.

### UI access vs Endpoint access
There are two related but distinct kinds of permission:

#### UI access
Whether a user has access to a certain page and the elements in it. The same page often uses different endpoints to fetch or mutate data, yet two users with different roles may still share the same access to a given component/page.

#### Endpoint access
What a user can read or mutate, controlled by which endpoint is used. The same resource generally has two endpoints — a `regular` one and a `restricted` one — differing in what they return, what they filter, and which fields they expose.

- `player`s get mutation access on the `regular` endpoint of resources scoped to their game, but never on the `restricted` endpoint.
- `DELETE` is its own mutation kind, distinct from `create`/`update` mutation — granting `regular`/`restricted` mutation access does not imply `DELETE` access; it is checked and configured on its own.

### Implementation
Four classes are needed, for now:
1. A class responsible for determining the roles of a user (given a user, a game, and a character).
2. Two classes responsible for determining whether a user has access to a given permission:
   - One for UI access.
   - One for endpoint access.
3. A class responsible for loading and keeping in memory the loaded permissions YAML config.

#### Roles class
Given a user, a game, and a PC character (all supplied at construction), it can return all applicable roles, and expose methods to check for a specific role.

- When no user is given: no role applies.
- When no game is given: only global roles can apply (`admin`, `logged_user`, `staff`).
- When no PC character is given: only global and game-scoped roles can apply (no `owner`).

| user given | game given | PC given | roles available to check (all others are false) |
| --- | --- | --- | --- |
| false | true/false | true/false | `[]` |
| true | false | true/false | `admin`, `logged_user`, `staff` |
| true | true | false | `admin`, `logged_user`, `staff`, `dm`, `player` |
| true | true | true | `admin`, `logged_user`, `staff`, `dm`, `player`, `owner` |

#### Permission granting base class
Initialized the same way (user, game, PC). Internally uses the roles class to resolve roles (which can also be injected, to ease testing). The UI permissions class and the endpoint permissions class both inherit from this base class.

Only the UI permissions class exposes this roles injection beyond tests — it's how the existing `?role=` simulated-preview behavior (showing what a hypothetical role would see in the UI) is powered: a caller can construct the UI permissions object with an already-resolved roles object instead of a real user/game/pc. The endpoint permissions class never accepts a simulated roles object outside of tests — endpoint checks always resolve roles from the real user/game/pc, since they gate actual API access, not a preview.

Permissions are checked in the context of a request, so the following are available:
- `user` (the logged-in user)
- `game` (from the `game_slug`)
- `pc` (if in PC scope, e.g. `/games/:game_slug/pcs/:id/...`)

##### Shortcut
- If the user is `admin`, permission methods always return true.
- If the user is `dm` of the given game, permission methods always return true.
- If the permission allows everyone, it returns true.

##### Configuration
Resource access configuration lives in YAML files, loaded through the config store class (queried by `resource` and `permission_type`). The YAML has, as keys, the permission scope, and inside, the allowed roles. `dm` and `admin` are not listed in the YAML since they're already covered by the shortcut.

The YAML shape differs between endpoint and UI configs, so each needs its own parsing class.

Example — `game_pc/endpoints.yml`:
```yml
regular:
  show:
    - everyone
  mutation:
    - player
    - staff
restricted:
  show:
    - owner
  mutation:
    - owner
```

Example — `game_pc/ui.yml`:
```yml
edit:
  - owner
  - staff
  - player
edit_restricted_attribute:
  - owner
```

##### Configuration store class
Parses the YAML, given a resource and type. If already loaded in memory it returns the parsed result (or a copy, to keep it immutable); otherwise it opens the file, parses it, stores it in memory, and returns it (again, a copy).

Keeps its own plain in-class dict for this — it does not route through `MemoryCache` (`backend/majora_project/cache/base.py`). The set of resource/type YAML files is small and fixed, known at review time, and never needs eviction, unlike `MemoryCache`'s per-user/per-game entries; going through it would risk an unrelated eviction forcing a needless re-parse, for no real benefit here.

##### UI permissions class
Exposes one method per UI permission (usually tied to a page or component). Permissions specify `resource` and `action` as strings; for UI components, the resource may be tied to the endpoint.

##### Endpoint permissions class
Similar to UI, the resource comes from the endpoint itself (each endpoint belongs to a specific resource), and each endpoint is of one type, `regular` or `restricted`. Given `resource` and `type` strings, the object can say whether the user has that access.

### Scope & migration
This is a full, behavior-preserving migration, not just a new framework alongside the old one:
- Every access decision currently made by `backend/games/permissions.py`'s ~24 classes (including resource-specific nuances such as PC vs NPC editor distinctions and hidden-row cascades) must still hold after the refactor — the YAML/role model needs to be expressive enough to reproduce them, even where that means resource-specific configuration rather than one generic rule.
- All existing call sites are migrated off `permissions.py` in this issue; `permissions.py` and the `backend/games/caches` classes it depends on are retired entirely, not left running in parallel.

### Naming & layout
`backend/games/permissions.py` becomes a package, `backend/games/permissions/`:
- `roles.py` — `Roles` class.
- `base.py` — `BasePermission` class.
- `ui.py` — `UIPermission` class.
- `endpoint.py` — `EndpointPermission` class.
- `config_store.py` — `PermissionConfigStore` class.

YAML config files live under `backend/games/permissions/config/<resource>/`, e.g. `config/game_pc/endpoints.yml` and `config/game_pc/ui.yml`, matching the `resource` key used to query `PermissionConfigStore`.

### Memory cache
`MemoryCache` (`backend/majora_project/cache/base.py`) stays as-is for now. The existing per-feature caches in `backend/games/caches` will be removed, since their keys and stored values need to be redesigned to fit the new roles/permissions model.

## Benefits
- Permission logic is centralized around a small, explicit set of roles instead of one class per action.
- UI access and endpoint access become clearly separated concerns, each with its own config format.
- Role resolution is testable in isolation (injectable roles class) and reusable across both permission classes.
- Configuration lives in YAML, making it easier to review and change allowed roles per resource/action without touching Python code.
