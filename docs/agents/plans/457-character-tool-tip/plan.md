# Plan: Character tool tip

Issue: [457-character-tool-tip.md](../issues/457-character-tool-tip.md)

## Overview

Add a single `info-circle-fill` badge to the character info bar (built by #456) that reveals a hover tooltip listing status items (Slain/Alive, Public Slain/Alive for both PC and NPC; Allegiance/Public Allegiance for NPC only), each with its own icon/text/color, omitting any item whose field is null/missing. Built as composable pieces (a badge/tooltip component, an item-list component, and a small rules class producing the item list) so `TreasureCard` — which already sits on the same `ActionsOverlay` foundation as characters — can reuse the same generic badge mechanism for its existing quantity badge instead of its own bespoke markup. Spans two agents: `frontend` (all component/logic work) and `translator` (new status-label strings in `frontend/assets/i18n/en.yaml`).

## Agents involved

- [frontend](frontend.md)
- [translator](translator.md)

## Shared contracts

`frontend` calls `Translator.t()` with the following new keys, which `translator` must add to `frontend/assets/i18n/en.yaml` under a new `character_status_badges` namespace (mirroring the existing `character_page`/`character_info` namespace convention in that file), with these exact English values:

```yaml
character_status_badges:
  slain: Slain
  alive: Alive
  public_slain: Known as Slain
  public_alive: Known as Alive
  enemy: Enemy
  ally: Ally
  neutral: Neutral
  public_enemy: Known as Enemy
  public_ally: Known as Ally
  public_neutral: Known as Neutral
```

`frontend` does not depend on `translator`'s work to proceed (missing keys fall back to the key itself per `Translator.t()`'s documented behavior — see `docs/agents/i18n.md`), so the two agents' work can be dispatched in parallel; `translator` only needs the exact key list and English text above, both already final.
