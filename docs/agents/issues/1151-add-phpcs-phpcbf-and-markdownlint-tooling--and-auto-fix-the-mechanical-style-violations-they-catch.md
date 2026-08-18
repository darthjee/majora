# Issue: Add phpcs/phpcbf and markdownlint tooling, and auto-fix the mechanical style violations they catch

## Context

Codacy runs `PHP_CodeSniffer` (PEAR/Squiz standards) against `proxy/` and `markdownlint` against every `.md` file in the repo, but only in Codacy's own cloud analysis — this repo has no local equivalent. There's no `phpcs.xml` ruleset, and no markdownlint config or `markdownlint-cli2` devDependency anywhere. As a result these violations can only be discovered after the fact on Codacy's dashboard, and can't be auto-fixed locally or blocked in CI.

`phpcs`/`phpcbf` already ship inside the `darthjee/tent-test:0.10.4` image (the same image the existing `proxy_tests` docker-compose service and `proxy_extension_tests` CI job already use) — just without a config today. No new `composer.json`/`vendor/` is needed for `proxy/`; markdownlint has no equivalent existing home, since there's no root-level `package.json` in the repo (only `frontend/package.json`).

The violations below are all mechanical, whitespace/formatting-only issues that `phpcbf` and `markdownlint --fix` resolve automatically once the tooling exists — no manual judgment needed per occurrence:

- `PHPCS_PEAR_Functions_FunctionCallSignature` (51) — multi-line function-call paren placement/indentation, PHP
- `PHPCS_Squiz_Functions_FunctionDeclarationArgumentSpacing` (18) — spacing around `=` in default arguments, PHP
- `markdownlint_MD032` (29) — lists must be surrounded by blank lines
- `markdownlint_MD022` (18) — headings must be surrounded by blank lines
- `markdownlint_MD012` (18) — no multiple consecutive blank lines

134 occurrences total across 71 files.

## What needs to be done

1. **phpcs**: add a `phpcs.xml` ruleset (extending PEAR/Squiz to match what Codacy already enforces) for `proxy/`. No new `composer.json`/`vendor` — reuse the `phpcs`/`phpcbf` already bundled in `darthjee/tent-test:0.10.4` via the existing `proxy_tests` docker-compose service (pointed at the new config).
2. **markdownlint**: add `markdownlint-cli2` as a devDependency in a new root-level `package.json`, with a config at the repo root, linting `docs/**/*.md` and `README.md`. For local use, add a new unpublished `dockerfiles/markdownlint/Dockerfile` (`FROM darthjee/node`) and a corresponding `markdownlint` service in `docker-compose.yml`, mirroring the existing `majora_fe` build-from-Dockerfile pattern.
3. **CI**: wire both in as native CircleCI jobs (no `docker-compose` in CI, matching the existing `checks`/`frontend-checks`/`proxy_extension_tests` convention of running commands directly inside a prebuilt `docker:` executor image):
   - phpcs: add a "Check PHP Lint" step to the existing `proxy_extension_tests` job (already on `darthjee/tent-test:0.10.4`).
   - markdownlint: new CircleCI job on the public `darthjee/node` image (`npm install` + `markdownlint-cli2` as steps), matching `frontend-checks`' shape.
4. Run `phpcbf` and `markdownlint --fix` once (via the new docker-compose services) to clear the 134 occurrences listed below, in this same PR.

**Out of scope**: a pre-commit hook. No pre-commit infrastructure (husky, `pre-commit` framework, git hooks) exists in this repo today, and adding it is deliberately left for a separate issue.

## Occurrences (134, across 71 files)

- `.claude/agents/translator.md`
  - line 27: Lists should be surrounded by blank lines
- `README.md`
  - line 1: Expected: 1; Actual: 0; Below
  - line 23: Lists should be surrounded by blank lines
  - line 32: Lists should be surrounded by blank lines
  - line 39: Lists should be surrounded by blank lines
  - line 85: Lists should be surrounded by blank lines
- `docs/agents/access-control/character-link.md`
  - line 17: Lists should be surrounded by blank lines
  - line 25: Lists should be surrounded by blank lines
- `docs/agents/access-control/character-photo.md`
  - line 8: Expected: 1; Actual: 0; Below
  - line 29: Expected: 1; Actual: 0; Below
  - line 30: Lists should be surrounded by blank lines
- `docs/agents/access-control/character.md`
  - line 37: Expected: 1; Actual: 0; Below
  - line 38: Lists should be surrounded by blank lines
  - line 61: Expected: 1; Actual: 0; Below
  - line 62: Lists should be surrounded by blank lines
  - line 64: Expected: 1; Actual: 0; Below
  - line 65: Lists should be surrounded by blank lines
  - line 74: Lists should be surrounded by blank lines
  - line 98: Expected: 1; Actual: 0; Below
  - line 106: Expected: 1; Actual: 0; Below
- `docs/agents/access-control/common-rules.md`
  - line 8: Lists should be surrounded by blank lines
- `docs/agents/access-control/endpoints.md`
  - line 6: Expected: 1; Actual: 0; Below
- `docs/agents/access-control/faction.md`
  - line 47: Lists should be surrounded by blank lines
- `docs/agents/access-control/game-document.md`
  - line 41: Expected: 1; Actual: 0; Below
- `docs/agents/access-control/game-item.md`
  - line 33: Expected: 1; Actual: 0; Below
- `docs/agents/access-control/game-photo.md`
  - line 6: Expected: 1; Actual: 0; Below
  - line 11: Expected: 1; Actual: 0; Below
- `docs/agents/access-control/game-session-message.md`
  - line 17: Lists should be surrounded by blank lines
- `docs/agents/access-control/game-treasure.md`
  - line 34: Lists should be surrounded by blank lines
  - line 45: Lists should be surrounded by blank lines
- `docs/agents/access-control/game.md`
  - line 47: Expected: 1; Actual: 0; Below
  - line 65: Lists should be surrounded by blank lines
  - line 87: Lists should be surrounded by blank lines
- `docs/agents/access-control/link.md`
  - line 16: Lists should be surrounded by blank lines
  - line 25: Lists should be surrounded by blank lines
- `docs/agents/access-control/player.md`
  - line 25: Lists should be surrounded by blank lines
  - line 30: Expected: 1; Actual: 0; Below
- `docs/agents/access-control/poll.md`
  - line 41: Lists should be surrounded by blank lines
- `docs/agents/access-control/upload.md`
  - line 48: Expected: 1; Actual: 0; Below
  - line 52: Lists should be surrounded by blank lines
- `docs/agents/architecture.md`
  - line 8: Lists should be surrounded by blank lines
- `docs/agents/architecture/backend.md`
  - line 5: Expected: 1; Actual: 0; Below
  - line 25: Lists should be surrounded by blank lines
- `docs/agents/architecture/frontend.md`
  - line 5: Expected: 1; Actual: 0; Below
- `docs/agents/architecture/product-owner.md`
  - line 6: Lists should be surrounded by blank lines
- `docs/agents/frontend.md`
  - line 19: Expected: 1; Actual: 2
- `docs/agents/frontend/api-client-requests.md`
  - line 6: Expected: 1; Actual: 2
- `docs/agents/frontend/bootstrap-linting-tests.md`
  - line 7: Expected: 1; Actual: 2
- `docs/agents/frontend/component-architecture.md`
  - line 35: Expected: 1; Actual: 2
- `docs/agents/frontend/directory-structure.md`
  - line 82: Expected: 1; Actual: 2
- `docs/agents/frontend/pages-elements.md`
  - line 16: Expected: 1; Actual: 2
- `docs/agents/frontend/routing-pagination.md`
  - line 8: Expected: 1; Actual: 2
- `docs/agents/frontend/running-locally.md`
  - line 21: Expected: 1; Actual: 2
- `docs/agents/pagination.md`
  - line 65: Lists should be surrounded by blank lines
- `docs/agents/product.md`
  - line 27: Expected: 1; Actual: 2
- `docs/agents/product/entities/character.md`
  - line 13: Expected: 1; Actual: 2
- `docs/agents/product/entities/game-document.md`
  - line 16: Expected: 1; Actual: 2
- `docs/agents/product/entities/game-item.md`
  - line 15: Expected: 1; Actual: 2
- `docs/agents/product/entities/gamemaster.md`
  - line 9: Expected: 1; Actual: 2
- `docs/agents/product/entities/ownership-and-roles.md`
  - line 166: Expected: 1; Actual: 2
- `docs/agents/product/entities/player.md`
  - line 24: Expected: 1; Actual: 2
- `docs/agents/product/entities/poll.md`
  - line 15: Expected: 1; Actual: 2
- `docs/agents/product/entities/treasure.md`
  - line 15: Expected: 1; Actual: 2
- `docs/agents/product/entities/user.md`
  - line 15: Expected: 1; Actual: 2
- `docs/agents/security-guidelines.md`
  - line 6: Lists should be surrounded by blank lines
- `proxy/dev_configuration/rules/admin.php`
  - line 11: Opening parenthesis of a multi-line function call must be the last content on the line
  - line 26: Closing parenthesis of a multi-line function call must be on a line by itself
- `proxy/dev_configuration/rules/backend.php`
  - line 9: Opening parenthesis of a multi-line function call must be the last content on the line
  - line 35: Closing parenthesis of a multi-line function call must be on a line by itself
- `proxy/dev_configuration/rules/cache.php`
  - line 5: Opening parenthesis of a multi-line function call must be the last content on the line
  - line 15: Closing parenthesis of a multi-line function call must be on a line by itself
- `proxy/dev_configuration/rules/delete.php`
  - line 5: Opening parenthesis of a multi-line function call must be the last content on the line
  - line 18: Closing parenthesis of a multi-line function call must be on a line by itself
- `proxy/dev_configuration/rules/files.php`
  - line 5: Opening parenthesis of a multi-line function call must be the last content on the line
  - line 19: Closing parenthesis of a multi-line function call must be on a line by itself
- `proxy/dev_configuration/rules/frontend.php`
  - line 12: Opening parenthesis of a multi-line function call must be the last content on the line
  - line 26: Closing parenthesis of a multi-line function call must be on a line by itself
- `proxy/dev_configuration/rules/photos.php`
  - line 5: Opening parenthesis of a multi-line function call must be the last content on the line
  - line 19: Closing parenthesis of a multi-line function call must be on a line by itself
- `proxy/dev_configuration/rules/private_game_data_cache.php`
  - line 26: Opening parenthesis of a multi-line function call must be the last content on the line
  - line 50: Closing parenthesis of a multi-line function call must be on a line by itself
- `proxy/dev_configuration/rules/redirects.php`
  - line 10: Opening parenthesis of a multi-line function call must be the last content on the line
  - line 25: Closing parenthesis of a multi-line function call must be on a line by itself
- `proxy/dev_configuration/rules/uploads.php`
  - line 5: Opening parenthesis of a multi-line function call must be the last content on the line
  - line 15: Closing parenthesis of a multi-line function call must be on a line by itself
- `proxy/extension/lib/cache/PrivateRequestHasher.php`
  - line 38: Incorrect spacing between argument "$headerName" and equals sign; expected 0 but found 1
- `proxy/extension/lib/configuration/cache_cleanup/treasures.php`
  - line 79: Opening parenthesis of a multi-line function call must be the last content on the line
  - line 81: Closing parenthesis of a multi-line function call must be on a line by itself
  - line 93: Opening parenthesis of a multi-line function call must be the last content on the line
- `proxy/extension/lib/handlers/CacheClearHandler.php`
  - line 45: Incorrect spacing between argument "$httpClient" and equals sign; expected 0 but found 1
  - line 46: Incorrect spacing between argument "$cachePath" and equals sign; expected 0 but found 1
- `proxy/extension/lib/handlers/CacheSizeHandler.php`
  - line 53: Incorrect spacing between argument "$httpClient" and equals sign; expected 0 but found 1
  - line 54: Incorrect spacing between argument "$cachePath" and equals sign; expected 0 but found 1
  - line 55: Incorrect spacing between argument "$cacheSizeTool" and equals sign; expected 0 but found 1
  - line 56: Incorrect spacing between argument "$calculator" and equals sign; expected 0 but found 1
  - line 110: Opening parenthesis of a multi-line function call must be the last content on the line
  - line 114: Closing parenthesis of a multi-line function call must be on a line by itself
- `proxy/extension/lib/handlers/DeleteHandler.php`
  - line 40: Incorrect spacing between argument "$httpClient" and equals sign; expected 0 but found 1
  - line 41: Incorrect spacing between argument "$photosBasePath" and equals sign; expected 0 but found 1
  - line 94: Opening parenthesis of a multi-line function call must be the last content on the line
  - line 98: Closing parenthesis of a multi-line function call must be on a line by itself
- `proxy/extension/lib/handlers/UploadHandler.php`
  - line 116: Incorrect spacing between argument "$httpClient" and equals sign; expected 0 but found 1
  - line 117: Incorrect spacing between argument "$photosBasePath" and equals sign; expected 0 but found 1
  - line 118: Incorrect spacing between argument "$filesBasePath" and equals sign; expected 0 but found 1
  - line 182: Opening parenthesis of a multi-line function call must be the last content on the line
  - line 186: Multi-line function call not indented correctly; expected 12 spaces but found 8
  - line 541: Opening parenthesis of a multi-line function call must be the last content on the line
  - line 546: Closing parenthesis of a multi-line function call must be on a line by itself
- `proxy/extension/lib/support/BackendClient.php`
  - line 44: Incorrect spacing between argument "$httpClient" and equals sign; expected 0 but found 1
  - line 94: Incorrect spacing between argument "$body" and equals sign; expected 0 but found 1
  - line 95: Incorrect spacing between argument "$extraAllowedHeaders" and equals sign; expected 0 but found 1
  - line 96: Incorrect spacing between argument "$overrideHeaders" and equals sign; expected 0 but found 1
- `proxy/extension/lib/support/DuDirectorySizeStrategy.php`
  - line 25: Incorrect spacing between argument "$shell" and equals sign; expected 0 but found 1
- `proxy/extension/lib/support/ForwardedHeaderFilter.php`
  - line 53: Incorrect spacing between argument "$extraAllowed" and equals sign; expected 0 but found 1
- `proxy/prod_configuration/rules/admin.php`
  - line 13: Opening parenthesis of a multi-line function call must be the last content on the line
  - line 21: Closing parenthesis of a multi-line function call must be on a line by itself
- `proxy/prod_configuration/rules/backend.php`
  - line 9: Opening parenthesis of a multi-line function call must be the last content on the line
  - line 36: Closing parenthesis of a multi-line function call must be on a line by itself
- `proxy/prod_configuration/rules/cache.php`
  - line 5: Opening parenthesis of a multi-line function call must be the last content on the line
  - line 15: Closing parenthesis of a multi-line function call must be on a line by itself
- `proxy/prod_configuration/rules/delete.php`
  - line 5: Opening parenthesis of a multi-line function call must be the last content on the line
  - line 18: Closing parenthesis of a multi-line function call must be on a line by itself
- `proxy/prod_configuration/rules/files.php`
  - line 5: Opening parenthesis of a multi-line function call must be the last content on the line
  - line 19: Closing parenthesis of a multi-line function call must be on a line by itself
- `proxy/prod_configuration/rules/frontend.php`
  - line 5: Opening parenthesis of a multi-line function call must be the last content on the line
  - line 19: Closing parenthesis of a multi-line function call must be on a line by itself
- `proxy/prod_configuration/rules/photos.php`
  - line 5: Opening parenthesis of a multi-line function call must be the last content on the line
  - line 19: Closing parenthesis of a multi-line function call must be on a line by itself
- `proxy/prod_configuration/rules/private_game_data_cache.php`
  - line 41: Opening parenthesis of a multi-line function call must be the last content on the line
  - line 66: Closing parenthesis of a multi-line function call must be on a line by itself
- `proxy/prod_configuration/rules/redirects.php`
  - line 10: Opening parenthesis of a multi-line function call must be the last content on the line
  - line 26: Closing parenthesis of a multi-line function call must be on a line by itself
- `proxy/prod_configuration/rules/uploads.php`
  - line 5: Opening parenthesis of a multi-line function call must be the last content on the line
  - line 15: Closing parenthesis of a multi-line function call must be on a line by itself
