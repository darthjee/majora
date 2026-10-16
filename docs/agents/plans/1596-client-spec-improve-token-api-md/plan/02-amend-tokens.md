# Amend tokens.md

#1596 changed two things in the Bearer authentication that `tokens.md` (settled by #1594)
specifies. Record them there, without reopening anything else:

1. **Bearer detection.** In `### Transport` / `### Authentication`, the backend treats a request
   as a Bearer request when its whole `Authorization` value matches `(^|,)\s*bearer(\s|$)`,
   case-insensitively, with joined headers included. This is the same rule the proxy uses (link
   to `token-api.md`'s caching decision). Any such value that does not split into exactly two
   parts, or whose token does not match the `mjr_` pattern, gives 401 `token_invalid`. This
   replaces the wording "Every `Bearer` header is treated as a Majora token" with the precise
   rule.
2. **Inactive owners.** Add `user.is_active` to the checks list: "format, prefix lookup, hash
   comparison, expiry, owner is active and their profile status is `approved`". A failure gives
   the same generic 401. Update `### Error reporting` and `### Testing strategy` (an inactive
   owner gives 401) to match.

Mention "amended by #1596" next to the "Refined by #1594" line in the Overview.

## Files to Change

- `docs/agents/specs/client/tokens.md`: Bearer detection rule, `is_active` check, error
  reporting and testing bullets, Overview attribution.
