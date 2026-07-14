# Issue: List treasures by value

## Description
Treasure list endpoints currently return results in default ordering (by `id`), rather than ordered by the treasure's value.

## Problem
Clients listing treasures across any of the three endpoints below see them in insertion order, making it hard to scan for the cheapest or most valuable items.

## Expected Behavior
All of the following endpoints should return treasures sorted by `value`, ascending:
- `/treasures.json`
- `/games/:game_slug/treasures.json`
- `/games/:game_slug/pcs/:id/treasures.json`

For the PC treasures endpoint, each result row is a `CharacterTreasure` (a treasure plus a quantity owned by the character). Sorting there should use the treasure's own unit `value`, not `value × quantity`.

Ties (equal values) should keep a stable secondary order by `id` (or `treasure__id` for the PC endpoint), so pagination results don't reshuffle between requests.

## Solution
Add explicit ordering to the querysets behind all three endpoints:
- `Treasure` querysets (`/treasures.json`, `/games/:game_slug/treasures.json`): `.order_by('value', 'id')`
- `CharacterTreasure` queryset (`/games/:game_slug/pcs/:id/treasures.json`): `.order_by('treasure__value', 'treasure__id')`
