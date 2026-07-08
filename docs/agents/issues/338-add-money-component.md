# Add money component

## Context

Character money and treasure value are currently converted and displayed through separate, ad-hoc code paths that both sit on top of the shared `CoinBreakdown` conversion class, but each configures it differently (denominations, cascade threshold) and formats the result differently:

- `CharacterMoney` / `CharacterMoneyHelper` (character page): uses `CoinBreakdown` with denominations `cp/sp/gp/pp` (+ overflow into gems), cascade threshold 30, pipe-separated display, renders nothing when the value is 0.
- `TreasureMoneyFormatter` (treasure cards/pages/exchange modal): uses `CoinBreakdown` with denominations restricted to `cp/sp/gp`, cascade threshold 10, sentence-style display ("1000 GP, 5 SP and 2 CP"), renders "0 GP" when the value is 0.

This issue formalizes that conversion behind an explicit *model* concept (starting with `dnd`, looked up by name through a registry), so both contexts share one model-driven transformation class instead of two independently configured call sites. This also prepares the codebase to support additional currency systems (e.g. a future dollar-based model) without changing the display components.

## What needs to be done

- Introduce a model registry (lookup by name, e.g. `dnd`) so a model class can be resolved by name today, and future models (e.g. a dollar-based one) can register alongside it without touching component code.
- The `dnd` model exposes a context-aware transformation, e.g. `model.transform(value, { context: 'character' })` vs `model.transform(value, { context: 'treasure' })`, each returning only the relevant subset of `{ copper, silver, gold, platinum, gems }` (character includes platinum/gems, treasure caps at gold) — including whatever cascade-threshold behavior that context currently uses (30 for character, 10 for treasure).
- Refactor the existing components to use this model instead of their current ad-hoc `CoinBreakdown` configuration:
  - `CharacterMoney` (character page) is updated to consume the `dnd` model with the `character` context.
  - The treasure display currently produced by `TreasureMoneyFormatter` (used in `TreasureCardHelper`, `TreasureHelper`, `TreasureExchangeModalHelper`) becomes a proper component consuming the `dnd` model with the `treasure` context, replacing the ad-hoc formatter at all of its call sites.
- Both components must keep their current display behavior exactly as today (formatting, separators, zero-value handling) — only the underlying conversion is unified/reorganized around the model.
- Out of scope: a second, dollar-based model (100 cents = 1 dollar) will be added later; the registry introduced here should not need to change to accommodate it.

## Acceptance criteria

- [ ] A model registry exists that resolves a currency model by name (e.g. `dnd`), and new models can be registered without changing component code.
- [ ] The `dnd` model exposes a context-aware transformation returning the correct subset of `{ copper, silver, gold, platinum, gems }` for `character` (cp/sp/gp/pp + gems, cascade threshold 30) and `treasure` (cp/sp/gp, cascade threshold 10) contexts.
- [ ] `CharacterMoney` (character page) is refactored to consume the `dnd` model with the `character` context, with unchanged display behavior (including rendering nothing when value is 0).
- [ ] The treasure money display (`TreasureCardHelper`, `TreasureHelper`, `TreasureExchangeModalHelper`) is refactored into a proper component consuming the `dnd` model with the `treasure` context, replacing `TreasureMoneyFormatter`, with unchanged display behavior (including rendering "0 GP" when value is 0).
- [ ] Existing tests/specs covering character money and treasure money display pass against the refactored code, updated as needed to reflect the new component/model structure.
