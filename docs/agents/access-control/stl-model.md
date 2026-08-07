# StlModel

**Not a [Game/Staff/Account/Sensitive-information resource](principles.md#resource-categories)**
— a new, fifth shape: a shared, cross-domain, login-only catalog with no game/staff/account fit.
`StlModel` (plus its `StlModelLink`, `StlModelPhoto`, `Source`, `Tag` companions, all in the
standalone `miniatures` app) catalogs STL 3D-printable files/miniatures that Majora only links to,
never hosts. Unlike [Game](game.md), it is intentionally not domain-scoped — it has no `domain`
field and is available across every domain.

| Action | Who can |
|--------|---------|
| List (`GET /miniatures.json`) | **IsAuthenticated** — no `AllowAny` regular form |
| Detail (`GET /miniatures/<id>.json`) | **IsAuthenticated** |
| Create/Update/Delete | None — no write endpoints exist yet for any of the five models; `Source`/`Tag`/`StlModel`/`StlModelLink`/`StlModelPhoto` are all Django-admin-only for now |

**Deviation — `X-Skip-Cache: true` on both endpoints.** Per [Permission
Principles](principles.md#x-skip-cache-rule), any endpoint not open to `AllowAny` always sets
this header; since both endpoints require login, they set it unconditionally, including on the
detail endpoint's 404 response.

## Fields

**List** (`StlModelListSerializer`): `id`, `name`, `photo_url` (`null` when no photo is set).

**Detail** (`StlModelDetailSerializer`): `id`, `name`, `photo_url`, `links` (`id`, `text`, `url`,
`link_type` — same shape as [Link](link.md)'s `GameLinkSerializer`), `sources` (`name` only, no
`id`), `tags` (flat array of strings, not `{id, name}` objects).

## No search/filter yet

`GET /miniatures.json` accepts no query parameters beyond the shared `Paginator`'s `page`/
`per_page` — no name/source/tag filtering, despite issue #1017's title. Deferred to a follow-up
issue.
