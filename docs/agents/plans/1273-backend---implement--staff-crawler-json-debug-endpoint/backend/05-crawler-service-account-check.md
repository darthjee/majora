# Crawler service-account staff check

Verify the crawler's service-account user has `is_staff=True` (or is a superuser) in
whatever environment(s) it runs against — the crawler already authenticates via API token
(`CookieTokenAuthentication`), so no new auth flow is needed, only this flag. This is a
one-time manual verification/fix (there is no service-account model or fixture in this
repo to codify it against — it's an operational user record), not a code change, so there
are no files to list here.

If the account is not already staff/superuser, flip it (e.g. via Django admin or a
one-off `manage.py shell` command in whichever environment needs it) before this harness
is exercised end-to-end by a real crawler run.

## Files to Change

None — this is an operational/data check, not a code change.
