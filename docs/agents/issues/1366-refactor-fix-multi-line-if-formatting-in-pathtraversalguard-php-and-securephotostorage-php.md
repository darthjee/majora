# Refactor: fix multi-line IF formatting in PathTraversalGuard.php and SecurePhotoStorage.php

## Context

Codacy's PHP_CodeSniffer scan (`PEAR.ControlStructures.MultiLineCondition`, CodeStyle, Info severity) flags 4 formatting issues in two multi-line `if` statements: the first condition doesn't directly follow the opening parenthesis, and continuation lines don't begin with a boolean operator.

## What needs to be done

Proxy: reformat the multi-line `if` statements at the locations below to match the project's PEAR control-structure convention (first condition directly after `(`, each continuation line starting with `&&`/`||`):

- proxy/extension/lib/support/PathTraversalGuard.php:65-66
- proxy/extension/lib/support/SecurePhotoStorage.php:124-125

## Acceptance criteria

- [ ] Both multi-line `if` statements match the PEAR multi-line-condition formatting convention
- [ ] Codacy's PHPCS `PEAR.ControlStructures.MultiLineCondition` finding clears for both files
- [ ] Existing proxy tests for these two classes still pass
