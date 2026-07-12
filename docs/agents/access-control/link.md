# Link

Links are read-only through the game detail endpoint (`links` array in `GameDetailSerializer`).
No direct link create/update/delete endpoint exists.

**Exposed fields** (read): `id`, `text`, `url`, `link_type` — visible to anyone who can read the
game detail (i.e. anyone). `link_type` is a non-sensitive display-icon enum (`''` or
`lootstudio`) driving which icon the frontend renders next to the link; it carries no
access-control implications.

**Write access:** superuser only (via Django admin, out of scope).
