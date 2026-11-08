# Production run

The first production run of `analyse.py`, moved here from #1703.

1. Ask the user for the go-ahead and the date range: it starts after the 1.5.0 deploy and should
   cover at least about 7 days of data.
2. `analyse-prod --dry-run`: confirms `STATISTICS_PROD_URL` is present in the root `.env`
   (https), without printing it or touching production.
3. `analyse-prod --from <day> --to <day> --username <staff user> --anonymised`. Stop for the
   user to approve the request as a production staff user (it expires after 1 hour; a denial or
   expiry ends the run cleanly and it is simply re-run).
4. Remind the user to revoke the token.

Use from the report: totals, extras per cause and per `creation_reason`, the disagreement
between heuristics and `creation_reason`, top `first_path` route patterns per reason, null-column
and self-session counts, any ID-reset segments. Only the anonymised summary is used outside
`reports/`.

## Files to Change

- None (read-only; reports are git-ignored).
