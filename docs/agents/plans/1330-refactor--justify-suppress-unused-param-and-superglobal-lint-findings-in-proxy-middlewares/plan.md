# Plan: Refactor: justify/suppress unused-param and superglobal lint findings in proxy middlewares

Issue: [1330-refactor--justify-suppress-unused-param-and-superglobal-lint-findings-in-proxy-middlewares.md](../issues/1330-refactor--justify-suppress-unused-param-and-superglobal-lint-findings-in-proxy-middlewares.md)

## Overview

Add native PHPMD `@SuppressWarnings(PHPMD.RuleName)` docblock annotations to the three intentional PHPMD findings in `proxy/extension/lib/middlewares/`, so they stop recurring as open Codacy findings.

See [proxy.md](proxy.md) for the full plan.
