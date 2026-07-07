# Add max units treasure

## Context

Today a treasure linked to a game (via the shared `Game.treasures` many-to-many connection) can be acquired by characters in unlimited quantity — there is no way for a GM to cap the total number of units of a treasure obtainable within a given game.

## What needs to be done

Add a stock cap to treasures shared within a game: an editable `max_units` field on the connection between a `Game` and a `Treasure`, plus a derived `available_units` value that decreases as characters acquire the treasure and increases as they sell it back.

Backend:
- Convert `Game.treasures` (currently a plain many-to-many) to use an explicit `through` model carrying `max_units` (nullable, user-editable via the treasure form, null means unlimited) and `acquired_units` (default 0, starts at 0 when the connection is created, never directly edited by a user).
- `available_units` is a derived value (`max_units - acquired_units`), never stored directly.
- Editing `max_units` later does not itself change `acquired_units`.
- When a character acquires N units, `acquired_units` increases by N (so `available_units` decreases by N); when N units are sold back, `acquired_units` decreases by N (so `available_units` increases by N).
- Extend the acquire/sell logic (`_treasure_exchange.py`) to read and update `acquired_units` on that through-row when `max_units` is set.
- A character cannot acquire more units than are currently available. If they request more than what is available, the request is **partially fulfilled**: as many units as are available are acquired (charging only for those) rather than rejecting the whole request. The response reflects how many units were actually acquired.
- A treasure with 0 available units still appears normally in treasure lists — it is not hidden, it simply cannot be acquired further.
- Expose `available_units` (derived) via the relevant serializers for the acquire/sell flow; expose both `available_units` and `max_units` for the game treasure list.
- Note: this only applies to the shared `Game.treasures` many-to-many connection — the separate "exclusive" `Treasure.game` FK is out of scope for this issue.

Frontend:
- In the treasure exchange modal's "acquire" browse list (the layout used when a character is acquiring a treasure), a limited treasure shows its `available_units` as a badge in the top-right corner of its card — shown even when the value is 0 or 1 (unlike the existing owned-quantity badge, which hides at 1 or fewer).
- In the game's treasure list page (the management view listing all of a game's treasures), a limited treasure shows both `available_units` and `max_units`.

## Acceptance criteria

- [ ] `Game.treasures` uses an explicit `through` model carrying nullable `max_units` and `acquired_units` (default 0)
- [ ] `max_units` is editable via the treasure form; `acquired_units` is never directly user-editable
- [ ] Acquiring N units increases `acquired_units` by N; selling N units decreases `acquired_units` by N
- [ ] Acquiring more than `available_units` partially fulfills the request instead of rejecting it, and charges/records only the units actually acquired
- [ ] A treasure with 0 available units still appears in treasure lists but cannot be acquired further
- [ ] Acquire/sell serializers expose `available_units`; game treasure list serializer exposes both `available_units` and `max_units`
- [ ] Acquire modal's browse list shows an always-visible `available_units` badge (even at 0 or 1) for limited treasures
- [ ] Game treasure list page shows both `available_units` and `max_units` for limited treasures

Tags: :shipit:
