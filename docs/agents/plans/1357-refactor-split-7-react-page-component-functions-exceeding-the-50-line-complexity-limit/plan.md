# Plan: Refactor: split 7 React page/component functions exceeding the 50-line complexity limit

Issue: [1357-refactor-split-7-react-page-component-functions-exceeding-the-50-line-complexity-limit.md](../issues/1357-refactor-split-7-react-page-component-functions-exceeding-the-50-line-complexity-limit.md)

## Overview

Codacy's Lizard scan (`nloc-medium`) flags 7 functions — 6 React page/component functions under `frontend/` and 1 request handler under `crawler/navi-extension/` — for exceeding 50 lines. Each gets a purely mechanical, no-behavior-change extraction of cohesive chunks (state/effect wiring into hooks, data-building into helper functions) so all 7 drop under 50 lines while existing specs keep passing unmodified.

## Agents involved

- [frontend](frontend.md)
- [crawler](crawler.md)

## Shared contracts

None. The frontend and crawler changes touch entirely separate files (`frontend/` vs `crawler/navi-extension/`) with no interface, shared schema, or dependency crossing between them — each agent's extraction is self-contained to its own file(s).
