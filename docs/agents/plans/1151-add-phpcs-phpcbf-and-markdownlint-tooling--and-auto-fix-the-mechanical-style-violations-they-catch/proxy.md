# Proxy Plan: Add phpcs/phpcbf and markdownlint tooling, and auto-fix the mechanical style violations they catch

Main plan: [plan.md](plan.md)

## Shared contracts

None — see [plan.md](plan.md)'s "Shared contracts" section.

## Implementation Steps

### Step 1 — Add a `phpcs.xml` ruleset for `proxy/`

`darthjee/tent-test:0.10.4` already bundles `phpcs`/`phpcbf` (Tent's own dev-tooling set, per `docs/agents/external/tent/extending-tent.md`) but ships no config — do **not** add a `composer.json`/`vendor/` to `proxy/`, that tooling is already present in the test image.

Add `proxy/phpcs.xml`:

```xml
<?xml version="1.0"?>
<ruleset name="MajoraProxy">
    <description>PHP_CodeSniffer ruleset for proxy/, matching the sniffs Codacy already enforces.</description>
    <file>.</file>
    <rule ref="PEAR.Functions.FunctionCallSignature"/>
    <rule ref="Squiz.Functions.FunctionDeclarationArgumentSpacing"/>
</ruleset>
```

**Open question to verify while implementing**: the issue's Codacy report only surfaces violations for these two specific sniffs (`PHPCS_PEAR_Functions_FunctionCallSignature`, `PHPCS_Squiz_Functions_FunctionDeclarationArgumentSpacing`), not the full PEAR or Squiz standards (which are much larger — doc-block, naming-convention, and indentation sniffs that would almost certainly surface many more than 134 combined PHP+markdown violations if enabled wholesale). Treat the two-sniff ruleset above as the starting point; if Codacy's actual project configuration is reachable (e.g. its dashboard/settings), confirm it isn't running a broader standard before locking this in. Run `phpcs --standard=proxy/phpcs.xml proxy/` and confirm the violation count/locations line up with the issue's "Occurrences" section (the `PHPCS_*` entries) as a sanity check.

### Step 2 — Wire `phpcs` into the local `proxy_tests` docker-compose service

`docker-compose.yml`'s `proxy_tests` service currently only mounts `./proxy/extension:/var/www/html/extension`, but violations also exist under `proxy/dev_configuration/rules/` and `proxy/prod_configuration/rules/`, which live outside that mount. Extend (or add a sibling command/profile on) `proxy_tests` so the full `proxy/` tree — and the new `proxy/phpcs.xml` — are reachable from inside the container for ad-hoc local `phpcs`/`phpcbf` runs, working-directory-relative to wherever `vendor/bin/phpcs` resolves in that image (see `docs/agents/external/tent/extending-tent.md` — `vendor/bin/phpcs` is run directly, no `composer lint` script is baked in).

Coordinate with [infra](infra.md) if this requires touching `docker-compose.yml` — that file is otherwise infra's turf, but the mount details here are proxy-specific.

### Step 3 — Add the CI lint step

In `.circleci/config.yml`'s existing `proxy_extension_tests` job (image `darthjee/tent-test:0.10.4`, `working_directory: /home/app/app`, checkout at `path: /tmp/checkout`), add a step before or after "Tests":

```yaml
- run:
    name: Check PHP Lint
    command: vendor/bin/phpcs --standard=/tmp/checkout/proxy/phpcs.xml /tmp/checkout/proxy
```

This runs phpcs directly against the checked-out source (`/tmp/checkout/proxy`) — it doesn't need the "Copy extension into place" step's `/var/www/html/extension` layout, since phpcs only reads files as text, unlike phpunit which needs Tent's runtime structure.

### Step 4 — Run `phpcbf` once to clear the existing PHP occurrences

Using the new ruleset (`vendor/bin/phpcbf --standard=proxy/phpcs.xml proxy/`, via whatever local invocation Step 2 lands on), auto-fix the `PHPCS_PEAR_Functions_FunctionCallSignature` (51) and `PHPCS_Squiz_Functions_FunctionDeclarationArgumentSpacing` (18) occurrences listed in the issue's "Occurrences" section — all under `proxy/dev_configuration/rules/`, `proxy/extension/lib/`, and `proxy/prod_configuration/rules/`. Purely mechanical whitespace/paren-placement fixes; no manual review of individual diffs should be needed, but do confirm `proxy_extension_tests`' existing PHPUnit suite still passes after the reformat (these are config/handler files it tests against).

## Files to Change

- `proxy/phpcs.xml` — new ruleset (Step 1)
- `docker-compose.yml` — extend `proxy_tests` service mount/command for local phpcs/phpcbf access (Step 2, coordinate with infra)
- `.circleci/config.yml` — add "Check PHP Lint" step to `proxy_extension_tests` (Step 3)
- The 20 files listed under `proxy/` in the issue's "Occurrences" section — mechanical `phpcbf` fixes only (Step 4)

## CI Checks

- `proxy/`: `vendor/bin/phpcs --standard=proxy/phpcs.xml proxy/` (CI job: `proxy_extension_tests`, new "Check PHP Lint" step)

## Notes

- No PHP version is documented anywhere in this repo (no proxy Dockerfile) — the sniffs run against whatever PHP ships inside `darthjee/tent-test:0.10.4`. Not expected to matter for these two mechanical sniffs, but worth knowing if phpcs behaves unexpectedly.
- `.claude/agents/proxy.md` references `darthjee/tent-test:0.7.8`, inconsistent with `.circleci/config.yml`/`docker-compose.yml`'s `0.10.4` — pre-existing drift, unrelated to this issue, not in scope to fix here.
