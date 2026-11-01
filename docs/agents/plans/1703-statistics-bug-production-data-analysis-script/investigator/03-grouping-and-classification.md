# Grouping and classification

Group the sessions that probably belong to one visitor, and classify every extra session in a
group. The functions here are pure, taking session dicts and returning results, so step 05 can
reuse them unchanged.

## Grouping (per segment)

1. **High confidence:** same `user_id` (not null).
2. **Low confidence:** anonymous sessions with the same domain and the same IP, each one
   created no more than `--race-window` seconds after the previous one or within its
   `last_seen_at` span. Unrelated visitors behind NAT can share an IP; the report says so.
   "Nearby IP" means the same IPv4 /24 or IPv6 /64, and is only used together with
   `creation_reason = ip_changed`.
3. **Linked by reason:**
   - A session with `creation_reason = ip_changed` joins the group of the most recent session
     on the same domain that is still within its active span and has a nearby IP. If there is
     none, the closest earlier session on the same domain within the race window.
   - A session with `creation_reason = domain_changed` joins the most recent session from the
     same IP on another domain within the race window.
   - Both are low confidence.

The first session of a group, by `created_at` then `id`, is the original. Every other session
is an **extra**.

## Classification of each extra

A heuristic cause:

| Cause | Heuristic |
|-------|-----------|
| `race` | created within the race window of a sibling, with the same IP and domain |
| `login_rotation` | sibling anonymous and this one has the user, or `first_seen_logged` true right after an anonymous sibling |
| `ip_change` | same group, different IP |
| `domain_change` | same group, different domain |
| `single_hit_orphan` | exactly one visit with `hits == 1`, and a sibling continues afterwards |
| `legitimate` | after the previous session's `last_seen_at` plus a gap (logout, expiry), or a bot-like single unresolved path |
| `other` | none of the above |

Then the cross-check against `creation_reason`:

- Expected reasons per cause:
  - `race` → `no_cookie` / `invalid_cookie` / `cookie_session_not_found`;
  - `login_rotation` → `login_rotation`;
  - `ip_change` → `ip_changed`;
  - `domain_change` → `domain_changed`.
- If `creation_reason` is set, it is the **primary** classification. A heuristic cause that
  does not fit it is recorded as a disagreement (session id, both values).
- If `creation_reason` is null (before #1701), the heuristic cause is used, and the session is
  counted in a separate "pre-columns" bucket.

## Files to Change

- `investigations/statistics-bug/analyse.py`: grouping, classification, the cross-check, and
  their data classes.
