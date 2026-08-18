# Plan: Capitalize inline PHP comments (Squiz Commenting.InlineComment)

Issue: [1155-capitalize-inline-php-comments--squiz-commenting-inlinecomment.md](../../issues/1155-capitalize-inline-php-comments--squiz-commenting-inlinecomment.md)

## Overview

Fix all 21 Codacy `Squiz.Commenting.InlineComment` findings in `proxy/`: capitalize 17 comments, add terminal punctuation to 3, and convert 2 disallowed inline doc-block `/** @var ... */` annotations to plain `//` comments. Pure comment-text/style changes — no behavior change.

See [proxy.md](proxy.md) for the full plan.
