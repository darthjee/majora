# Plan: Refactor: bracket unbracketed operations flagged by PHPCS across proxy/

Issue: [1362-refactor-bracket-unbracketed-operations-flagged-by-phpcs-across-proxy.md](../../issues/1362-refactor-bracket-unbracketed-operations-flagged-by-phpcs-across-proxy.md)

## Overview

Wrap every operation flagged by PHPCS's `Squiz.Formatting.OperatorBracket` sniff across `proxy/` in parentheses, purely a formatting change with no behavior impact.

See [proxy.md](proxy.md) for the full plan.
