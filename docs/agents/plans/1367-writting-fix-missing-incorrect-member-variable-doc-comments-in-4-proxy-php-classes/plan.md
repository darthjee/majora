# Plan: Fix missing/incorrect member variable doc comments in 4 proxy/ PHP classes

Issue: [1367_fix_missing_incorrect_member_variable_doc_comments_in_4_proxy_php_classes.md](../../issues/1367-writting-fix-missing-incorrect-member-variable-doc-comments-in-4-proxy-php-classes.md)

## Overview

Fix 4 `Squiz.Commenting.VariableComment` findings flagged by Codacy's PHPCS scan in `proxy/` PHP classes: one missing member-variable doc comment, and three `@var` tags using PHP's short scalar type names (`int`, `bool`) instead of the PEAR/PHPCS long forms (`integer`, `boolean`).

See [proxy.md](proxy.md) for the full plan.
