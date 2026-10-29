# Session Tracking Columns

Part of the [Statistics Bug](../statistics-bug.md) specs (Epic #1696).

*Planned by #1712 (storage), #1713 (API) and #1714 (UI).* Nothing on this page exists yet. It
is the single design contract for those sub-issues; every other spec page links here instead of
repeating the definitions. If an implementing PR has to deviate, it updates this page in the
same PR.

The columns let the investigation read *why* each statistics `Session` was created, instead of
inferring it from timestamps and IPs. They are **permanent**: they stay after the fix, and the
implementing PRs describe them in [Access Statistics](../../statistics.md).

## Columns

| Model | Column | Type | Meaning | Written when |
|---|---|---|---|---|
| `Session` | `first_path` | `CharField(255)`, null | Route pattern of the request that created the session (see [Path values](#path-values)) | At creation |
| `Session` | `first_seen_logged` | boolean, null | Whether the creating request ended authenticated: user at creation, in-place attach after the view, or a login rotation | Once, in the creating request |
| `Session` | `creation_reason` | `CharField` with choices, null | Why the row was created (see [Creation reasons](#creation-reasons)) | At creation |
| `Visit` | `first_path` | `CharField(255)`, null | Route pattern of the request that opened the visit | When the visit opens |
| `Visit` | `last_path` | `CharField(255)`, null | Route pattern of the latest request of the visit | When the visit opens, and in the existing `hits = hits + 1` update |

The last path lives on `Visit`, not on `Session`: the visit is already updated on every request,
while `Session.last_seen_at` is throttled (`session_touch_interval`).

## Creation reasons

| Reason | Trigger in the code |
|---|---|
| `no_cookie` | The request carries no `majora_statistics` cookie (`_load_or_create_session`). |
| `invalid_cookie` | The cookie fails to unsign. |
| `cookie_session_not_found` | The token is valid but no matching row exists (deleted, e.g. by a statistics Clear, #1684). |
| `domain_changed` | The token's session exists, but for another domain. |
| `ip_changed` | The cookie's session exists, but its IP differs from the request's. |
| `login_rotation` | `attach_user` created a new row: the always-rotate path for a pre-existing anonymous session, or an in-place attach that lost a race. |

Today `_session_from_cookie` filters by token **and** domain, so a domain change looks like
"not found". #1712 must tell `domain_changed` apart from `cookie_session_not_found` (for example
by looking the session up by token, then comparing the domain) without changing which sessions
are reused or created.

## Path values

- The path columns store the **route pattern**, never the raw path:
  `resolve(request.path_info).route`, for example
  `games/<slug:game_slug>/documents/<int:id>.json`. No URL parameter is ever stored.
- A path that resolves to no route (a `404`, bots) stores the fixed marker `unresolved`.
- The query string is never stored.
- At most 255 characters.
- Resolution is in-memory URL matching before the view runs: no database query.

Why: **no token or secret is ever stored**, by construction. The device-authorization routes
(`users/authorization_requests/<uuid:uuid>.json`,
`account/authorization_requests/<uuid:uuid>/authorize.json` and `.../deny.json`) carry the
request `uuid`, the poll secret, in the path, and the poll requests stay tracked (see
[Export endpoint](export-endpoint.md#caching-and-tracking)). Ids and slugs are not stored
either.

## Rules

- Untracked paths and requests carrying the skip header store nothing, as today.
- Rows created before the migration keep `NULL`, meaning *unknown*. There is no backfill.
- No change to which sessions are reused, created or rotated. The fix belongs to the issue
  created by #1705.
- Cost: no extra query per request; at most one extra lookup, to tell `domain_changed` from
  `cookie_session_not_found`.

## Delivery

- **#1712 (storage, backend):** the columns, migration and middleware writes; documents them in
  the permanent [Access Statistics](../../statistics.md) *Data model*.
- **#1713 (API, backend):** exposes them in the
  [export endpoint](export-endpoint.md#endpoint-contract) and the staff visit list; documents
  them in the permanent *Export endpoint* and *Visit list* sections.
- **#1714 (UI, frontend):** shows them on the staff visits page and dashboard, with `en` and `pt`
  translations.
- **#1701** releases them. Production data carries them only from that release on.

## How the investigation uses them

- `emulate.py` checks the expected creation reason of each scenario.
- `analyse.py` uses `creation_reason` as its primary signal, with the heuristics as a fallback
  for `NULL` rows.

See [Hypotheses](hypotheses.md) for the evidence each cause leaves and [Scripts](scripts.md) for
the details.
