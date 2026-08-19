# Plan: Explore a config-driven registry for Header's controls (and nav links)

Issue: [1186-explore-a-config-driven-registry-for-header-s-controls--and-nav-links.md](../../issues/1186-explore-a-config-driven-registry-for-header-s-controls--and-nav-links.md)

## Overview

Replace `HeaderHelper`/`HeaderNavHelper`'s inline `if (!state.x) return null` guard-clause rendering with a flat, declarative registry (`{id, rules, render}` entries), backed by two new small, generic, dependency-free utilities: `CurrentPageContext` (pure `state → derived flags`) and `RuleMatcher` (declarative `all`/`any`/`none`/`exists` rule evaluation). Frontend-only, single-owner work.

See [frontend.md](frontend.md) for the full plan.
