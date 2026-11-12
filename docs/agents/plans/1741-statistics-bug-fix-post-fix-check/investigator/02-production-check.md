# Production check

After the owner's go-ahead and date range (starting 2026-11-13, about a week or more):

```bash
docker-compose -f investigations/statistics-bug/docker-compose.yml run --rm analyse-prod \
  --from <date> --to <date> --anonymised
```

The owner approves the device authorization as a production staff user and revokes the token
afterwards. Read the report and collect aggregate counts only:

- new `ip_changed` sessions: expected none;
- sessions whose `first_path` is `unresolved`: expected none;
- new sessions on the direct host's domain: expected none (counted, never named; use `--domain`
  if a per-domain count is needed, without writing the value anywhere);
- new sessions with no domain: reported separately (default-hostname traffic, #1750's concern);
- grouped extra sessions per visitor by classification, compared with the pre-fix numbers in
  `findings.md`;
- visits whose `first_ip` differs from `last_ip`, if the export shows it: the IP changes now kept
  on the visit instead of splitting the session.

## Files to Change

- None (reports stay in the git-ignored `reports/`).
