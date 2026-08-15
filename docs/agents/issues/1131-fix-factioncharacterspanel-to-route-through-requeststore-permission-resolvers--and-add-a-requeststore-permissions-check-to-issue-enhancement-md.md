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
falls back to `NO_PERMISSIONS()` (`{}`).

**Confirmed (via investigation): explicit `variantName` for `remove`/`acquire`
is deliberate, not an oversight to "fix" with a new resolver.**
`factionConfig.js`'s header comment states the `permission` field on
`acquire`/`remove` mutation variants is "documentation-only" and that callers
must pass `variantName` explicitly — mirroring `documentConfig.js`'s own
shape. `RequestStore.mutate`'s own JSDoc for `variantName` spells out why:
it exists for exactly this case, "when the caller has already decided which
variant applies (e.g. from an already-loaded character's `can_edit`) and a
fresh, possibly-stale-relative-to-that-decision permission re-check would
risk picking a different variant than the payload was built for." So adding a
`faction.remove` resolver and letting `RequestStore.mutate` auto-pick would
go against this codebase's established, documented pattern for mutations —
**the fix should instead have `FactionCharactersPanelController` derive
`isDmOrAdmin` from the permissions already resolved for `fetchPage()`'s
`faction.characters` read**, rather than adding a mutation resolver.

Also worth noting for accuracy: `AccessStore.ensureGamePermissions` is backed
by `AccessCache.ensure()`, which dedupes concurrent calls sharing the same
cache key (`gameSlug` + role set). Since `#load()` invokes
`Promise.all([this.isDmOrAdmin(gameSlug), this.fetchPage(gameSlug, factionId)])`,
both calls are issued in the same synchronous tick and, in practice, already
collapse into a single network round-trip today (the second call finds the
first's pending cache entry). So the concrete problem this issue fixes is
**not** a network-efficiency/double-round-trip issue — it's that
`FactionCharactersPanelController` bypasses the `RequestStore`/
`RequestPermissionResolvers` pattern that every other resource controller
follows, via a direct `AccessStore` import/call that duplicates a
permission-resolution decision `RequestStore.ensure` already makes for the
same load.

## What needs to be done

**Frontend** (`frontend/assets/js/components/resources/faction/...` and
`frontend/assets/js/utils/requests/...`):

- Do **not** add a `faction.remove`/`faction.acquire` resolver to
  `RequestPermissionResolvers.js` — confirmed (see Context) that explicit
  `variantName` on `acquire`/`remove` mutations is deliberate, mirroring
  `documentConfig.js`/`RequestStore.mutate`'s own documented rationale for
  the `variantName` param. Auto-pick must stay reserved for reads.
- Instead, fix `FactionCharactersPanelController` to derive `isDmOrAdmin` from
  the single permissions object that `RequestStore.ensure`/
  `RequestPermissionResolvers` already resolves for `fetchPage()`'s
  `faction.characters` call (`RequestPermissionResolvers.resolve('faction',
  'characters', { gameSlug })`, the same `can_edit` check
  `isDmOrAdmin`/`AccessStore.ensureGamePermissions` performs today), rather
  than issuing a second, independent `AccessStore.ensureGamePermissions` call
  from the controller. This removes the direct `AccessStore` dependency from
  `FactionCharactersPanelController` and routes the controller entirely
  through the `RequestStore`/`RequestPermissionResolvers` pattern.
  - `FactionCharactersPanelController` should no longer import/call
    `AccessStore` directly unless there's a documented reason it must bypass
    the `RequestStore`/`RequestPermissionResolvers` pattern — in which case
    that reason should be captured in a code comment, consistent with how
    other exceptions (if any) are documented elsewhere in the codebase.
  - Update/add Jasmine specs for `FactionCharactersPanelController` to cover
    the fixed behavior: no direct `AccessStore` call from the controller, and
    the kick action still picks the correct regular/private endpoint (via
    explicit `variantName`) for both DM/admin and non-DM/admin users.

**Docs** (`docs/agents/issue-enhancement.md`):

- Add a new standalone checklist item, **Permissions** — who can access or
  act on the feature being described, and how that access is resolved
  (e.g. which store/resolver mechanism determines it) — alongside the
  existing items (Scope boundaries, Alternative solutions, Edge cases,
  Backward compatibility, Testing strategy, Performance & security
  considerations).
- Within that item (or as a sub-bullet of it), explicitly call out: for
  **reads**, when a component or controller needs to pick between a regular
  and a restricted/permission-gated endpoint variant, it must go through
  `RequestStore`'s permission-resolver auto-pick mechanism
  (`RequestPermissionResolvers.js`) rather than calling `AccessStore`
  directly, unless there is a documented reason the component needs to
  bypass that pattern. For **mutations**, note the codebase's established
  exception (see `RequestStore.mutate`'s `variantName` param and
  `factionConfig.js`/`documentConfig.js`'s "documentation-only" `permission`
  fields on `acquire`/`remove`-style variants): callers may pass an explicit
  `variantName` derived from an already-resolved permissions check instead of
  relying on auto-pick, to avoid a stale re-check picking a different variant
  than the payload was built for — but that already-resolved check should
  still come from the same `RequestStore`/`RequestPermissionResolvers` read
  path, not a redundant direct `AccessStore` call.

## Acceptance criteria

- [ ] `FactionCharactersPanelController` no longer imports/calls
      `AccessStore` directly — `isDmOrAdmin` is derived from the permissions
      `RequestStore.ensure`/`RequestPermissionResolvers` already resolves for
      `fetchPage()`'s `faction.characters` call.
- [ ] No `faction.remove`/`faction.acquire` resolver is added to
      `RequestPermissionResolvers.js` — mutation variant selection for
      `remove`/`acquire` continues to use explicit `variantName`, per
      `RequestStore.mutate`'s documented rationale.
- [ ] Any remaining direct `AccessStore` usage in `FactionCharactersPanelController`
      (if any is still needed) is accompanied by a code comment documenting
      why it's necessary.
- [ ] Jasmine specs cover the fixed permission-resolution path for
      `FactionCharactersPanelController` (page load derives `isDmOrAdmin`
      without a direct `AccessStore` call, and the kick action still picks
      the correct regular/private endpoint via explicit `variantName`).
- [ ] `docs/agents/issue-enhancement.md`'s checklist gains a new "Permissions"
      item covering who can access/act on a feature and how that's resolved,
      including the explicit rule that endpoint-variant selection for reads
      must go through `RequestStore`'s permission-resolver auto-pick
      mechanism unless explicitly justified otherwise.
- [ ] No behavioral regression: DM/admin users still see the full character
      list (via the `/all.json` variant) and can still kick characters; non
      DM/admin users still see the restricted list and cannot kick.
