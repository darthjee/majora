# Fix FactionCharactersPanel to route through RequestStore permission resolvers, and add a RequestStore/permissions check to issue-enhancement.md

## Context

While investigating the `DocumentPagesBox` issue (#1126), we found that
`FactionCharactersPanelController`
(`frontend/assets/js/components/resources/faction/pages/elements/controllers/FactionCharactersPanelController.js`)
does not fully follow the frontend's standard permission-resolution pattern.

Elsewhere in the codebase — e.g. `document` resource controllers such as
`CharacterDocumentDetailController.js` — components never call `AccessStore`
directly. Instead they call `RequestStore.ensure`/`RequestStore.mutate` with a
`resource`/`quantityType`, and `RequestStore` internally asks
`RequestPermissionResolvers.resolve(resource, quantityType, params)` to fetch
the caller's permissions and auto-pick between a `regular` and `private`
(`/all.json`-style) path/variant defined in the resource's request config
(e.g. `factionConfig.js`). The component itself never needs to know which
permission check happened or which endpoint was used.

`FactionCharactersPanelController` breaks this pattern in one place: its
`isDmOrAdmin(gameSlug)` method calls `AccessStore.ensureGamePermissions(gameSlug)`
directly, in parallel with (and independently of) the `RequestStore.ensure`
call already made by `fetchPage()` for the `faction.characters` quantity type
(which is resolved correctly, via the `characters` resolver in
`RequestPermissionResolvers.js`). The controller's own `#load()` method fires
both calls concurrently via `Promise.all([this.isDmOrAdmin(...), this.fetchPage(...)])`,
so a single page load triggers two independent permission-check network
round-trips against the same underlying game permissions.

The `isDmOrAdmin` result is then used only to decide which mutation variant
(`private` vs `regular`) to pass explicitly to `RequestStore.mutate` when a
DM/admin kicks a character from the faction (the `remove` quantity type in
`factionConfig.js`). Note: `RequestPermissionResolvers.js` currently has no
`faction.remove` resolver entry at all — `RESOLVERS.faction` only defines
`collection`, `availableCollection`, `characters`, and `summary` — so today
`RequestPermissionResolvers.resolve('faction', 'remove', params)` silently
falls back to `NO_PERMISSIONS()` (`{}`). Also note `factionConfig.js`'s header
comment states that the `permission` field on `acquire`/`remove` mutation
variants is "documentation-only" and that callers are expected to pass
`variantName` explicitly for those mutations, rather than relying on
auto-resolution — this may be a deliberate constraint for mutations (as
opposed to reads) that needs to be confirmed/respected rather than blindly
overridden.

## What needs to be done

**Frontend** (`frontend/assets/js/components/resources/faction/...` and
`frontend/assets/js/utils/requests/...`):

- Investigate whether a `faction.remove` (and, if relevant, `faction.acquire`)
  resolver can be added to `RequestPermissionResolvers.js` (mirroring the
  existing `characters`/`summary` resolvers' use of `AccessStore.ensureGamePermissions`
  / `AccessStore.ensureCharacterPermissions`) so that `RequestStore.mutate`
  can auto-pick the `regular`/`private` variant for the kick action, the same
  way reads already do.
  - If mutation auto-pick genuinely cannot or should not be used for `remove`
    (per the "documentation-only" caveat in `factionConfig.js`), then instead
    fix `FactionCharactersPanelController` to derive `isDmOrAdmin` from the
    single permissions object that `RequestStore.ensure`/`RequestPermissionResolvers`
    already resolves for `fetchPage()`'s `faction.characters` call, rather
    than issuing a second, independent `AccessStore.ensureGamePermissions`
    call. Either approach removes the duplicate permission round-trip and the
    direct `AccessStore` dependency from the controller.
  - Whichever approach is taken, `FactionCharactersPanelController` should no
    longer import/call `AccessStore` directly unless there's a documented
    reason it must bypass the `RequestStore`/`RequestPermissionResolvers`
    auto-pick mechanism — in which case that reason should be captured in a
    code comment, consistent with how other exceptions (if any) are
    documented elsewhere in the codebase.
  - Update/add Jasmine specs for `FactionCharactersPanelController` (and for
    `RequestPermissionResolvers.js` if a new resolver entry is added) to
    cover the fixed behavior, including that only one permission check fires
    per page load and that the kick action still picks the correct
    regular/private endpoint for both DM/admin and non-DM/admin users.

**Docs** (`docs/agents/issue-enhancement.md`):

- Add a new standalone checklist item, **Permissions** — who can access or
  act on the feature being described, and how that access is resolved
  (e.g. which store/resolver mechanism determines it) — alongside the
  existing items (Scope boundaries, Alternative solutions, Edge cases,
  Backward compatibility, Testing strategy, Performance & security
  considerations).
- Within that item (or as a sub-bullet of it), explicitly call out: when a
  component or controller needs to pick between a regular and a
  restricted/permission-gated endpoint variant, it must go through
  `RequestStore`'s permission-resolver auto-pick mechanism
  (`RequestPermissionResolvers.js`) rather than calling `AccessStore`
  directly, unless there is a documented reason the component needs to
  bypass that pattern.

## Acceptance criteria

- [ ] `FactionCharactersPanelController` no longer performs a redundant,
      independent `AccessStore.ensureGamePermissions` call when
      `RequestStore.ensure`/`RequestPermissionResolvers` has already resolved
      the same game's permissions for the same page load — either by adding a
      `faction.remove` resolver to `RequestPermissionResolvers.js` and letting
      `RequestStore.mutate` auto-pick the kick variant, or by reusing the
      permissions object already resolved for `fetchPage()`.
- [ ] Any remaining direct `AccessStore` usage in `FactionCharactersPanelController`
      (if the auto-pick mechanism cannot fully replace it) is accompanied by a
      code comment documenting why it's necessary.
- [ ] Jasmine specs cover the fixed permission-resolution path for both
      `FactionCharactersPanelController` (page load and kick action) and any
      new/changed entries in `RequestPermissionResolvers.js`.
- [ ] `docs/agents/issue-enhancement.md`'s checklist gains a new "Permissions"
      item covering who can access/act on a feature and how that's resolved,
      including the explicit rule that endpoint-variant selection must go
      through `RequestStore`'s permission-resolver auto-pick mechanism unless
      explicitly justified otherwise.
- [ ] No behavioral regression: DM/admin users still see the full character
      list (via the `/all.json` variant) and can still kick characters; non
      DM/admin users still see the restricted list and cannot kick.
