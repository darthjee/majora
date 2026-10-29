# Investigation plan and symptom

**`docs/agents/specs/statistics-bug/investigation-plan.md`:**

- **Order and dependencies** diagram and bullets:

  ```text
  #1697 specs, #1698 agent
    -> #1699 scope + export endpoint (backend), #1708 scoped device authorization (backend)
    -> #1700 scope UI (frontend)
    -> #1711 tracking-column specs
    -> #1712 tracking columns: storage (backend)
    -> #1713 tracking columns: API (backend)
    -> #1714 tracking columns: UI (frontend)
    -> #1701 version bump (after #1712 and #1713; #1714 does not block it)
    -> #1702 emulate.py
    -> #1703 analyse.py (production run after #1701 and after data has accumulated)
    -> #1704 code review & findings
    -> #1705 fix issue
  ```

  - #1699 bullet: scoped device authorization moved to #1708.
  - New bullet: #1711–#1714 add the [tracking columns](tracking-columns.md); they only collect
    data from the #1701 release on, so the production run of `analyse.py` analyses a range
    after it.
- **Constraints:** keep "the session reuse and creation logic does not change in this Epic";
  replace "the only middleware change allowed is #1699's exemption" with: the allowed
  middleware changes are #1699's exact-route exemption and #1712's tracking columns, which
  record *why* a session was created without changing *whether* it is created.

**`docs/agents/specs/statistics-bug/symptom.md`:**

- In *How sessions are reused today*, add the `creation_reason` each branch records (link to
  [Creation reasons](tracking-columns.md#creation-reasons)): no cookie → `no_cookie`;
  unsignable cookie → `invalid_cookie`; token without row → `cookie_session_not_found`;
  domain mismatch → `domain_changed`; IP mismatch → `ip_changed`; rotation in `_backfill_user`
  → `login_rotation`; in-place attach creates nothing (sets `first_seen_logged`).
- In *Legitimate new sessions*, note the reason each one is expected to show (cleared cookies
  / private window / other device → `no_cookie`; Clear → `cookie_session_not_found`; real IP
  change → `ip_changed`; logout → `no_cookie` on the next request).

## Files to Change

- `docs/agents/specs/statistics-bug/investigation-plan.md` — order, dependencies, constraints.
- `docs/agents/specs/statistics-bug/symptom.md` — reason per reuse branch and legitimate case.
