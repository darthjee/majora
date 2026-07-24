# Translator Plan: Add select item from list

Main plan: [plan.md](plan.md)

## Shared contracts

The frontend agent (see [frontend.md](frontend.md)) references these keys from the new
`itemExchangeTabs.js` config and the new `AcquireItemTab`/`RemoveItemTab`
components/controllers in the same PR — this addition must land together with that change, or
the app renders raw key strings and `check_i18n` won't catch the mismatch (it only checks the
two languages stay in sync with each other, not that the frontend references exist).

## Implementation Steps

### Step 1 — Add the `item_exchange_modal` namespace

Add a new top-level `item_exchange_modal` key to both `frontend/assets/i18n/en.yaml` and
`frontend/assets/i18n/pt.yaml`, mirroring `treasure_exchange_modal`'s existing namespace but
trimmed to only what the Acquire/Remove-only modal needs — no `buy_tab`/`sell_tab`/
`your_money`/`quantity_label`/`already_owned`/`insufficient_funds`/`not_enough_owned`/
`available_units_badge`/`partially_fulfilled` (all buy/sell/quantity-specific, none of which
apply to items). Add a `hidden_label` key instead, for the new Acquire tab's hidden switch, and
an `already_owned_error` key for the 400 "already owned" response.

`en.yaml`, inserted near `treasure_exchange_modal` (same nesting/indent style):

```yaml
item_exchange_modal:
  title: Item Exchange
  search_placeholder: Search items...
  acquire_tab: Acquire
  acquire_tab_tooltip: Acquire a copy of the item
  remove_tab: Remove
  remove_tab_tooltip: Removes an item
  hidden_label: Hidden
  confirm: Confirm
  cancel: Cancel
  back: Back
  cancel_selection: Cancel
  loading: Loading items...
  empty: No items available.
  load_error: Unable to load items. Please try again.
  already_owned_error: This item is already owned.
  generic_error: Unable to complete this action. Please try again.
```

`pt.yaml`, same structure:

```yaml
item_exchange_modal:
  title: Troca de Item
  search_placeholder: Buscar itens...
  acquire_tab: Adquirir
  acquire_tab_tooltip: Adquire uma cópia do item
  remove_tab: Remover
  remove_tab_tooltip: Remove um item
  hidden_label: Oculto
  confirm: Confirmar
  cancel: Cancelar
  back: Voltar
  cancel_selection: Cancelar
  loading: Carregando itens...
  empty: Nenhum item disponível.
  load_error: Falha ao carregar itens. Por favor, tente novamente.
  already_owned_error: Este item já foi adquirido.
  generic_error: Não foi possível concluir esta ação. Por favor, tente novamente.
```

The `acquire_tab_tooltip`/`remove_tab_tooltip` copy is taken verbatim from the issue's own
specified tooltip text ("Acquire a copy of the item" / "Removes an item").

### Step 2 — Add the "Exchange Items" button label

Add one key to the existing `character_items_page` namespace in both files, next to
`new_item`:

- `en.yaml`: `exchange_items: Exchange Items`
- `pt.yaml`: `exchange_items: Trocar Itens`

### Step 3 — Verify sync

Run `npm run check_i18n` locally to confirm both languages still have matching key sets after
the additions.

## Files to Change

- `frontend/assets/i18n/en.yaml`
- `frontend/assets/i18n/pt.yaml`

## CI Checks

- `frontend`: `npm run check_i18n` (CI job: `frontend-checks`)

## Notes

- Confirm the exact final key names/copy with the frontend agent if its tab
  components end up needing anything not listed here (e.g. an explicit "no search results"
  string) — this list is derived from the treasure modal's precedent plus the issue's own
  specified tooltip copy, not from a finished frontend implementation.
- Do not port `treasure_exchange_modal`'s quantity/money-related keys — items have no quantity
  or money interaction, and copying them unused would fail nothing automated but is dead weight.
