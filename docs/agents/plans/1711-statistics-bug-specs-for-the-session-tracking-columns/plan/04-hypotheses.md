# Hypotheses: tracking evidence

In `docs/agents/specs/statistics-bug/hypotheses.md`, add the bullet **Tracking evidence:**
(linking [Tracking columns](tracking-columns.md)) to each hypothesis, after *Production
pattern*, and mention it in the intro's list of what each entry carries:

- **1. IP flip from Tent custom handlers:** `ip_changed` with `first_path` on a route served by
  a custom handler (`cache.php`, `delete.php`, `uploads.php` routes).
- **2a. No-cookie race:** several `no_cookie` sessions created within milliseconds, each with a
  different API `first_path`.
- **2b. Login-rotation race:** several `login_rotation` sessions for one user at the same
  instant.
- **2c. `Set-Cookie` ordering:** no reason of its own (the older session is reused) — visits
  whose `last_path` alternates between two sessions, or `cookie_session_not_found` if the older
  one was deleted. (Hypothesis 2 has one *Tracking evidence* bullet listing 2a–2c.)
- **3. Other IP change:** `ip_changed` with an ordinary `first_path`, no burst.
- **4. Domain mismatch:** `domain_changed`.
- **5. Proxy/cache replaying `Set-Cookie`:** `ip_changed`, or a session shared by unrelated
  visitors, whose `first_path` is a cached route. Keep the private-reporting note.
- **6. Cookie not stored or not sent:** a stream of `no_cookie` sessions whose `first_path` is
  not an entry page.

Add one sentence: sessions created before the #1701 release have `NULL` columns, so for them
only the heuristic *Production pattern* applies.

## Files to Change

- `docs/agents/specs/statistics-bug/hypotheses.md` — intro sentence and one *Tracking
  evidence* bullet per hypothesis.
