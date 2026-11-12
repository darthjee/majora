# Common Items Filters

Specs for Epic #1766. `GameCommonItem` is the per-game catalog of common items, each with a
`price` and a `category` (7 fixed choices: `potion`, `drug`, `consumable`, `ammunition`,
`poison`, `gear`, `other`). Today both common items indexes accept only `?name=` (#1449), and
the common items page has no filter UI at all.

The Epic adds `category`, `min_price` and `max_price` (alongside the existing `name`) to both
common items indexes, plus a filter bar on the common items page. These pages are the shared
contract for the Epic's sub-issues: the query params and their edge cases, the backend helper
layout, the filter bar behaviour and the tests that follow from them.

Background on who can read common items:
[Game Common Item access control](../access-control/game-common-item.md).

## Aspect pages

- [API contract](common-items-filters/api-contract.md): query params on both indexes, their
  semantics, edge-case rules #1 to #15 with rationale, permissions and the filter-visibility
  rule.
- [Backend](common-items-filters/backend.md): where the filters apply, the helper refactor
  (including the param-name fix) and the no-Navi-change note.
- [Frontend](common-items-filters/frontend.md): filter bar interaction model, query building,
  hash state, paging, translations and variant selection.
- [Testing](common-items-filters/testing.md): backend and frontend test matrix derived from the
  decisions.

## Sub-issues

Status lives on GitHub: see Epic #1766's sub-issues. This table maps each sub-issue to the spec
pages it follows.

| Issue | Title | Page(s) |
|-------|-------|---------|
| #1769 | Write the common items filters specs | all |
| #1770 | Add category and price-range filters to the game common items index (backend) | [API contract](common-items-filters/api-contract.md), [Backend](common-items-filters/backend.md), [Testing](common-items-filters/testing.md) |
| #1771 | Add a filter bar to the game common items page (frontend) | [API contract](common-items-filters/api-contract.md), [Frontend](common-items-filters/frontend.md), [Testing](common-items-filters/testing.md) |
| #1772 | Remove the common items filters specs | all |

When a sub-issue is added or dropped, update this table.

## Non-goals

- Ordering by price.
- Multi-select category.
- Filters on the common item detail page.
- Filter bars for other resources.
- A `?hidden=` filter (see the
  [filter-visibility rule](common-items-filters/api-contract.md#filter-visibility-rule)).

## Lifecycle

- **During the Epic:** a sub-issue that has to deviate from these pages updates the relevant
  page in the same PR, so the specs stay the source of truth.
- **Removal (#1772):**
  1. move the durable rules and their rationale into
     [Game Common Item access control](../access-control/game-common-item.md), and the helper
     location into the views docs if relevant;
  2. unregister this index from [Specs](../specs.md);
  3. delete this file and `docs/agents/specs/common-items-filters/`.
- Permanent docs must **not** link into `docs/agents/specs/common-items-filters/`. Links only go
  from these pages outward.
