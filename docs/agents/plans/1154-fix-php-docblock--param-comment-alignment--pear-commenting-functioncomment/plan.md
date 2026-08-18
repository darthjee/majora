# Plan: Fix PHP docblock @param comment alignment (PEAR Commenting.FunctionComment)

Issue: [1154-fix-php-docblock--param-comment-alignment--pear-commenting-functioncomment.md](../../issues/1154-fix-php-docblock--param-comment-alignment--pear-commenting-functioncomment.md)

## Overview
Fix the 33 `PHPCS_PEAR_Commenting_FunctionComment` docblock issues Codacy still flags across 12 files in `proxy/extension/lib/` — mostly `@param`/`@var` continuation-line misalignment, plus a missing constructor docblock and a missing `@return` tag. None of these are safely auto-fixable by `phpcbf`, so they're fixed by hand.

See [proxy.md](proxy.md) for the full plan.
