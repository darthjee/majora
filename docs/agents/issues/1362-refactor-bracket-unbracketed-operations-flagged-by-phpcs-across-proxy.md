# Refactor: bracket unbracketed operations flagged by PHPCS across proxy/

## Context

Codacy's PHP_CodeSniffer scan (`Squiz.Formatting.OperatorBracket`, CodeStyle, Info severity) flags 14 operations across `proxy/` that mix operators without parentheses, making operator precedence harder to read at a glance and easier to get wrong when the expression is edited later.

## What needs to be done

Proxy: wrap the flagged operations in parentheses at each location below, per the project's PHP_CodeSniffer ruleset:

- proxy/extension/lib/middlewares/CacheCleanupMapBuilder.php:48, :49
- proxy/extension/lib/support/SecurePhotoStorage.php:126
- proxy/extension/lib/support/BackendClient.php:120
- proxy/extension/lib/cache/PrivateRequestHasher.php:58
- proxy/extension/lib/support/PathTraversalGuard.php:67
- proxy/dev_configuration/rules/photos.php:17
- proxy/dev_configuration/rules/domain.php:17
- proxy/dev_configuration/rules/frontend.php:43
- proxy/dev_configuration/rules/files.php:17
- proxy/prod_configuration/rules/files.php:17
- proxy/prod_configuration/rules/domain.php:17
- proxy/prod_configuration/rules/photos.php:17
- proxy/prod_configuration/rules/frontend.php:17

## Acceptance criteria

- [ ] All 14 flagged operations are wrapped in parentheses
- [ ] Proxy PHPCS lint passes with 0 `Squiz.Formatting.OperatorBracket` findings
- [ ] Existing proxy tests still pass
