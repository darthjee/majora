# Infra Plan: Production: Authorization header doesn't reach the backend (mod_fcgid); scoped API tokens get 401

Main plan: [plan.md](plan.md)

## Shared contracts

- Rely on the proxy agent producing `proxy/prod_htaccess/.htaccess` (see
  [plan.md](plan.md#shared-contracts)).
- Deploy it unchanged to the release root as `.htaccess`, after `upload_proxy_files`.

## Implementation Steps

### Step 1 — Deploy the versioned `.htaccess` from CI

In `.circleci/config.yml`, job `copy_proxy_configuration`, replace the `Setup .htaccess` step
(`TARGET=.htaccess DEPLOY_PATH=./ bin/deploy_frontend.sh copy_files`, which copies the live
server's file) with an upload of the versioned file, e.g.:

```yaml
- run:
    name: Upload .htaccess
    command: SOURCE=proxy/prod_htaccess/.htaccess DEPLOY_PATH=./ bin/deploy_frontend.sh upload
```

Check `bin/deploy_frontend.sh`'s `remote_temp_dir`/`DEPLOY_PATH` handling so the file lands at
the release root as `.htaccess` (rsync of a single file to the directory). Keep the job's
`requires: [upload_proxy_files]` so it still overwrites Tent's default `.htaccess`. Leave
`Setup locals` (`configuration/locals.php`, which holds secrets) as a server copy.

### Step 2 — Note the deploy change

If any infra/deploy doc describes `copy_proxy_configuration` or the `.htaccess` copy (search
`docs/` and `AGENTS.md`), update it to say the `.htaccess` now comes from
`proxy/prod_htaccess/.htaccess`. The runtime explanation lives in
`docs/agents/architecture/proxy.md` (proxy agent); don't duplicate it.

## Files to Change

- `.circleci/config.yml` — `copy_proxy_configuration`: upload the versioned `.htaccess` instead of
  copying the server's copy.
- Deploy docs, only if one already describes this step.

## CI Checks

- `.circleci/config.yml`: `circleci config validate` if available locally (the deploy jobs only
  run on tags, so the change is only exercised by the next release).

## Notes

- The change can't be exercised before a tagged release; verification happens in production
  (see [plan.md](plan.md#verification-after-the-next-tagged-release)).
