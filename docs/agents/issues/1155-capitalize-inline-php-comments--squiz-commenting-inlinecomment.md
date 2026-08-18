# Issue: Capitalize inline PHP comments (Squiz Commenting.InlineComment)

## Description
Codacy's PHP_CodeSniffer (Squiz `Commenting.InlineComment` sniff) flags 21 inline `//` comments across 11 files under `proxy/`. None are auto-fixable by `phpcbf`, since rewriting comment text/style isn't something the fixer does.

The 21 occurrences break down into three distinct violation types:
- **Capitalization** (17 occurrences): the comment doesn't start with a capital letter.
- **Missing terminal punctuation** (3 occurrences): the comment doesn't end in `.`, `!`, or `?`.
- **Disallowed inline doc-block style** (2 occurrences): a `/** ... */` doc-block-style comment is used where the sniff requires a plain `//` or `/* */` comment. Both of these are actually `/** @var Type $var */` type-hint annotations preceding a `foreach`, used by some IDEs for type inference.

## Problem
Inline comments across the `proxy/` codebase are inconsistent in style: some lack capitalization, some lack ending punctuation, and two use a doc-block annotation style the sniff disallows for inline comments. This causes Codacy/PHPCS lint failures.

## Solution
For each flagged occurrence:
- **Capitalize** the first letter of the comment (17 occurrences across 10 files).
- **Add terminal punctuation** (`.`, `!`, or `?`) to the end of the comment (3 occurrences: `proxy/dev_configuration/rules/frontend.php:11`, `:28`, and `proxy/extension/lib/configuration/cache_cleanup/treasures.php:59`).
- **Convert the two disallowed inline doc-block comments** to a sniff-compliant form (2 occurrences: `proxy/extension/lib/handlers/CacheClearHandler.php:113`, `proxy/extension/lib/support/PhpWalkDirectorySizeStrategy.php:39`).

Full list of occurrences:
- `proxy/dev_configuration/rules/frontend.php`
  - line 11: must end in full-stop/exclamation/question mark
  - line 28: must end in full-stop/exclamation/question mark
- `proxy/extension/lib/configuration/cache_cleanup/documents.php`
  - line 10: must start with a capital letter
- `proxy/extension/lib/configuration/cache_cleanup/factions.php`
  - line 14: must start with a capital letter
- `proxy/extension/lib/configuration/cache_cleanup/games.php`
  - line 19: must start with a capital letter
- `proxy/extension/lib/configuration/cache_cleanup/items.php`
  - lines 20, 33, 46, 59, 72: must start with a capital letter
- `proxy/extension/lib/configuration/cache_cleanup/npcs.php`
  - lines 30, 40: must start with a capital letter
- `proxy/extension/lib/configuration/cache_cleanup/pcs.php`
  - line 29: must start with a capital letter
- `proxy/extension/lib/configuration/cache_cleanup/possessions.php`
  - line 14: must start with a capital letter
- `proxy/extension/lib/configuration/cache_cleanup/treasures.php`
  - lines 37, 47, 76, 90: must start with a capital letter
  - line 59: must end in full-stop/exclamation/question mark
- `proxy/extension/lib/handlers/CacheClearHandler.php`
  - line 113: inline doc block comment not allowed
- `proxy/extension/lib/support/PhpWalkDirectorySizeStrategy.php`
  - line 39: inline doc block comment not allowed

## Benefits
- Clears all 21 Codacy/PHPCS `Commenting.InlineComment` findings in `proxy/`.
- Consistent, readable inline comment style across the proxy codebase.
