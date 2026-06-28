# Plan: Add Game Links

Issue: [134-add-game-links.md](../issues/134-add-game-links.md)

## Overview

Render the `game.links` array on the game detail page. Links are already returned by the existing `GET /games/:game_slug.json` endpoint via `GameDetailSerializer`, so no backend or infra changes are needed. The entire work is a frontend change to `GameHelper.jsx` and its spec.

## Agents involved

- [frontend](frontend.md)

## Shared contracts

No cross-agent contracts — this is a single-agent change.
