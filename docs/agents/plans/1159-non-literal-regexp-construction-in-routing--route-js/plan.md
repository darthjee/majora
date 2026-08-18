# Plan: Non-literal RegExp construction in routing (Route.js)

Issue: [1159-non-literal-regexp-construction-in-routing--route-js.md](../../issues/1159-non-literal-regexp-construction-in-routing--route-js.md)

## Overview
Suppress the Codacy/ESLint `security/detect-non-literal-regexp` and `security-node/non-literal-reg-expr` finding on the `new RegExp(...)` call in `Route.js` with a documented inline exception — the pattern it builds from is always a hardcoded, developer-authored route template, never user/URL-controlled input.

See [frontend.md](frontend.md) for the full plan.
