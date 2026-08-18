# Plan: Non-literal filesystem calls in i18n check script and jsx-loader

Issue: [1160-non-literal-filesystem-calls-in-i18n-check-script-and-jsx-loader.md](../../issues/1160-non-literal-filesystem-calls-in-i18n-check-script-and-jsx-loader.md)

## Overview

Codacy's ESLint security scan (`security/detect-non-literal-fs-filename`) flags 4 dynamic-path filesystem calls in two frontend tooling files. All 4 build their paths entirely from trusted, repo-local sources, so this is a lint false positive; the fix is to document that trust inline with justified `eslint-disable-next-line` comments rather than add any runtime validation.

See [frontend.md](frontend.md) for the full plan.
