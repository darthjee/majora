# Permission Principles

Shared conventions that recur across multiple resources in this document set. Each is stated
once here; per-resource files (e.g. [Character](character.md)) link back to this file instead of
re-deriving the rationale, keeping only what's specific to that resource.

## Source of truth & access levels

The backend is the sole source of truth for who can access what — it is responsible for blocking
read or write access whenever the requester lacks it, never the frontend.

Roles, from broadest to narrowest scope:

1. **Superuser** — admin access on all pages.
2. **Staff** — staff access on all pages.
3. **Resource-scoped roles** — depend on the page/resource being accessed:
   - **`dm`** — GameMaster of the game in the resource path.
   - **`player`** — any player of the game in the resource path.
   - **`owner`** — the player who owns the character in the resource path.

These map directly onto the roles already defined in [User Roles](user-roles.md) — this is not a
new role vocabulary, just a description of how those roles rank relative to one another.

## Partial vs full access pattern

When a resource has two access classes — a wider-audience "partial" view and a narrower
"full" view — the backend exposes **two separate routes** for the same resource, rather than
branching a shared serializer or filter by the requester's role:

| Action | Partial route | Full route |
|--------|---------------|------------|
| Show | `GET .../:id.json` | `GET .../:id/full.json` |
| Update | — (not accepted) | `PATCH .../:id/full.json` |
| Index | `GET ....json` | `GET .../all.json` |

A requester lacking full access simply gets no access to the full-access route (401/403) — there
is no partial fallback response on that route.

## Public vs regular attribute pattern

When an attribute has a restricted "real" value and a wider-audience "public" value, the model
carries **two fields**: `x` (the real value) and `public_x` (the public value).

- The partial/limited endpoint exposes `public_x` under the plain `x` JSON key, so the frontend
  always reads one key (`x`) regardless of which endpoint served the payload.
- The full endpoint exposes both keys separately: `x` (real) and `public_x` (public).
- Filtering on the partial endpoint filters against the `public_x` column; filtering on the full
  endpoint filters against the real `x` column — each endpoint filters on the same field it
  exposes under the shared key, so a query param never lets an unauthorized caller filter on data
  it cannot otherwise read.

See `allegiance`/`public_allegiance` and `slain`/`public_slain` on [Character](character.md) for
a concrete example.

## Public/regular is distinct from hidden attributes

The public/regular pattern above is not the same thing as a plain **hidden attribute** (e.g.
`description` vs `hidden_description`). A hidden attribute is simply absent from responses for
audiences who lack access — there is no alternate public value substituted in its place, unlike
`x`/`public_x` above where every audience gets a value, just not always the real one.
