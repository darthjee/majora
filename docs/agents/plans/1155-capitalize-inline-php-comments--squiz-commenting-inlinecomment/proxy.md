# Proxy Plan: Capitalize inline PHP comments (Squiz Commenting.InlineComment)

Main plan: [plan.md](plan.md)

## Shared contracts

None — single-agent, comment-only change with no code behavior, API, or interface impact.

## Implementation Steps

### Step 1 — Capitalize comments missing an initial capital letter (17 occurrences)

For each contiguous `//` comment block below, capitalize only the **first letter of the block's first line** (the sniff checks the block as a whole, not each line). Locate by the quoted text, not by line number — some line numbers have drifted since Codacy scanned (see Notes).

- `proxy/extension/lib/configuration/cache_cleanup/documents.php:10` — `// documents entity family — routes mutating a GameDocument or its files/photos.` → `// Documents entity family — ...`
- `proxy/extension/lib/configuration/cache_cleanup/factions.php:14` — `// factions entity family — routes mutating a single GameFaction.` → `// Factions entity family — ...`
- `proxy/extension/lib/configuration/cache_cleanup/games.php:19` — `// games entity family — the game's own cover photo upload. GameListSerializer` (multi-line block; only line 19's leading letter matters) → `// Games entity family — ...`
- `proxy/extension/lib/configuration/cache_cleanup/items.php:20` — `// items entity family — routes mutating a single GameItem.` → `// Items entity family — ...`
- `proxy/extension/lib/configuration/cache_cleanup/items.php:33` — `// pcs items — a PC's item detail/photo-upload route.` → `// Pcs items — ...`
- `proxy/extension/lib/configuration/cache_cleanup/items.php:46` — `// pcs items acquire/remove (single and bulk) — clears the PC's items list.` → `// Pcs items acquire/remove ...`
- `proxy/extension/lib/configuration/cache_cleanup/items.php:59` — `// npcs items — an NPC's item detail/photo-upload route.` → `// Npcs items — ...`
- `proxy/extension/lib/configuration/cache_cleanup/items.php:72` — `// npcs items acquire/remove (single and bulk) — clears the NPC's items list.` → `// Npcs items acquire/remove ...`
- `proxy/extension/lib/configuration/cache_cleanup/npcs.php:30` — `// npcs.json (collection) — clearing the npcs list itself.` → `// Npcs.json (collection) — ...`
- `proxy/extension/lib/configuration/cache_cleanup/npcs.php:40` — `// npcs entity family — routes mutating a single NPC.` → `// Npcs entity family — ...`
- `proxy/extension/lib/configuration/cache_cleanup/pcs.php:29` — `// pcs entity family — routes mutating a single PC.` → `// Pcs entity family — ...`
- `proxy/extension/lib/configuration/cache_cleanup/possessions.php:14` — `// possessions entity family — routes mutating a single GamePossession.` → `// Possessions entity family — ...`
- `proxy/extension/lib/configuration/cache_cleanup/treasures.php:37` — `// treasures.json (collection).` → `// Treasures.json (collection).`
- `proxy/extension/lib/configuration/cache_cleanup/treasures.php:47` — `// treasures entity — a single treasure.` → `// Treasures entity — ...`
- `proxy/extension/lib/configuration/cache_cleanup/treasures.php:76` — `// pcs treasures buy/sell/acquire/remove — pcs entity targets plus the` (multi-line block) → `// Pcs treasures buy/sell/acquire/remove — ...`
- `proxy/extension/lib/configuration/cache_cleanup/treasures.php:92` (issue file says line 90; drifted) — `// npcs treasures buy/sell/acquire/remove — npcs entity targets plus the` (multi-line block) → `// Npcs treasures buy/sell/acquire/remove — ...`

Keep the rest of each comment's text unchanged — only the leading character of the first word changes case.

### Step 2 — Add terminal punctuation (3 occurrences)

Add a trailing `.` (matches the style already used elsewhere in these files, e.g. `// Treasures.`) to the end of the comment block's last line:

- `proxy/dev_configuration/rules/frontend.php:11` — `// Development mode: forward to the Vite server (HMR)` → `// Development mode: forward to the Vite server (HMR).`
- `proxy/dev_configuration/rules/frontend.php:28` (issue file's line; now at line 30 — drifted) — `// Production mode: serve static files from docker_volumes/static/` → `// Production mode: serve static files from docker_volumes/static/.`
- `proxy/extension/lib/configuration/cache_cleanup/treasures.php:59` — `// Treasures` (already capitalized) → `// Treasures.`

### Step 3 — Convert disallowed inline doc-block comments (2 occurrences)

Replace the standalone `/** @var Type $var */` doc-block placed inline inside a method body (immediately before a `foreach`) with a plain `//` comment of the same content. `@var` annotations are exempt from the sniff's capitalization/punctuation checks, so no further tweak is needed once converted to `//` form:

- `proxy/extension/lib/handlers/CacheClearHandler.php:113` — `/** @var SplFileInfo $entry */` → `// @var SplFileInfo $entry`
- `proxy/extension/lib/support/PhpWalkDirectorySizeStrategy.php:39` — `/** @var SplFileInfo $file */` → `// @var SplFileInfo $file`

Do **not** touch any other `@var` doc-blocks in `proxy/` — every other occurrence is a legitimate property-level or array-shape PHPDoc block attached to a declaration, not an inline statement-position comment, and is not flagged by the sniff.

### Step 4 — Verify

`proxy/phpcs.xml` (the `MajoraProxy` ruleset used by the CI job `proxy_extension_tests`) does **not** currently register `Squiz.Commenting.InlineComment`, so the standard CI phpcs command will report 0 errors before *and* after this fix — it won't actually verify anything. To verify locally, explicitly target the sniff Codacy uses:

```bash
docker run --rm -v "$PWD":/repo darthjee/tent-test:0.10.4 sh -c '
  cd /home/app/app
  vendor/bin/phpcs --standard=Squiz --sniffs=Squiz.Commenting.InlineComment \
    --extensions=php --ignore=*/extension/tests/* /repo/proxy
'
```

Confirm it reports 0 errors after the changes (it reports exactly the 21 listed above beforehand). Also run the existing proxy test suite to confirm no behavioral regressions (comment-only changes, but the two `@var` conversions touch lines adjacent to loop logic):

```bash
docker compose run --rm proxy_tests
```

## Files to Change

- `proxy/dev_configuration/rules/frontend.php`
- `proxy/extension/lib/configuration/cache_cleanup/documents.php`
- `proxy/extension/lib/configuration/cache_cleanup/factions.php`
- `proxy/extension/lib/configuration/cache_cleanup/games.php`
- `proxy/extension/lib/configuration/cache_cleanup/items.php`
- `proxy/extension/lib/configuration/cache_cleanup/npcs.php`
- `proxy/extension/lib/configuration/cache_cleanup/pcs.php`
- `proxy/extension/lib/configuration/cache_cleanup/possessions.php`
- `proxy/extension/lib/configuration/cache_cleanup/treasures.php`
- `proxy/extension/lib/handlers/CacheClearHandler.php`
- `proxy/extension/lib/support/PhpWalkDirectorySizeStrategy.php`

## CI Checks

- `proxy`: `vendor/bin/phpcs --standard=/tmp/checkout/proxy/phpcs.xml /tmp/checkout/proxy` (CI job: `proxy_extension_tests`) — **note**: this command currently will not catch `Commenting.InlineComment` violations at all (see Step 4); use the explicit `--sniffs=Squiz.Commenting.InlineComment` command above to actually verify this fix.
- `proxy`: `docker compose run --rm proxy_tests` (CI job: `proxy_extension_tests`, PHPUnit portion) — sanity check that no behavior broke.

## Notes

- Two line numbers in the original issue file have drifted due to unrelated commits since Codacy last scanned: `frontend.php:28` is now `:30`, and `treasures.php:90` is now `:92`. Locate all occurrences by the quoted comment text above, not by line number alone.
- For multi-line comment blocks, the sniff only checks the leading capital of the first line and the trailing punctuation of the last line of that contiguous block — do not need to touch interior lines.
- Separate/out-of-scope finding surfaced during exploration, not part of this issue: `proxy/phpcs.xml` doesn't mirror Codacy's actual active sniff set (it's missing `Squiz.Commenting.InlineComment` among others), so the CI job silently fails to regression-guard this class of finding. Worth its own follow-up issue if the maintainer wants local CI to catch these before Codacy does.
