# Issue: Refactor: fix multi-line IF formatting in PathTraversalGuard.php and SecurePhotoStorage.php

## Description
Codacy's PHP_CodeSniffer scan (`PEAR.ControlStructures.MultiLineCondition`, CodeStyle, Info severity) flags formatting issues in two multi-line `if` statements in the proxy PHP codebase: the first condition doesn't directly follow the opening parenthesis, and continuation lines don't begin with a boolean operator.

## Problem
The following multi-line `if` statements don't match the project's PEAR multi-line-condition convention:

- `proxy/extension/lib/support/PathTraversalGuard.php:65-66`
- `proxy/extension/lib/support/SecurePhotoStorage.php:124-125`

## Solution
Reformat both `if` statements so the first condition sits directly after the opening `(`, and each continuation line starts with `&&`/`||`, matching the codebase's existing PEAR control-structure style (consistent with recent similar Codacy-driven fixes in `proxy/`).

Acceptance criteria:
- [ ] Both multi-line `if` statements match the PEAR multi-line-condition formatting convention
- [ ] Codacy's PHPCS `PEAR.ControlStructures.MultiLineCondition` finding clears for both files
- [ ] Existing proxy tests for these two classes still pass

## Benefits
Clears the Codacy PHPCS `PEAR.ControlStructures.MultiLineCondition` finding for both files and keeps formatting consistent with the rest of the proxy/ codebase.
