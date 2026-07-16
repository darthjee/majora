# Issue: Improve Treasure Exchange Modal (Search, Sorting, Money Display, Button Rename)

## Description
On `/#/games/:game_slug/pcs/:id/treasures`, an "Add Treasure" button opens a modal that lets the character acquire treasures from the game's treasure pool or sell treasures they own. This issue improves that modal's usability without changing its core acquire/sell functionality.

## Problem
- The button label "Add Treasure" does not reflect that the modal is used for both acquiring and selling (trading) treasures.
- The modal has no way to search treasures by name, on either the acquire or sell tab.
- On the acquire tab, treasures are listed in ascending order by value; descending order is wanted instead.
- The modal does not show the character's current money, making it hard to judge affordability while browsing.

## Expected Behavior

### Button rename
- Rename "Add Treasure" to "Exchange Treasure" (English) / "Trocar Tesouros" (Portuguese).

### Search
- Add a search input above the treasure list, present on both the acquire and sell tabs.
- Search matches treasure name via case-insensitive substring match, on any part of the name.
- The list updates live as the user types (debounced), without requiring an extra submit action.
- Entering a new search term resets the list back to page 1.

### Sorting (acquire tab only)
- Reverse the acquire tab's list order from ascending to descending by treasure value.
- The sell tab's ordering is unchanged.

### Money display
- At the top of the modal, show the character's money breakdown.
- Money is loaded from the character's public data.
- After every successful exchange (acquire or sell), reload the character's public data so the money display reflects the latest balance.

## Solution

### Backend
- Acquire endpoint (`GET /games/:game_slug/treasures.json`): add a `search` query param (case-insensitive substring match on treasure name) and reverse the existing ordering to descending by value.
- Sell endpoint (`GET /games/:game_slug/pcs/:id/treasures.json`): add a `search` query param (case-insensitive substring match on treasure name); ordering unchanged.

### Frontend
- Add a search input to the modal's browse list (used by both acquire and sell tabs), wired to the respective endpoint's new `search` param.
- Update the acquire/sell modal controller and API client calls to pass the `search` param and reflect the acquire endpoint's new descending order.
- Add a money breakdown display at the top of the modal, reusing the character money component already used elsewhere.
- On successful exchange, refetch the character's public data (instead of only patching `money` locally from the mutation response) so the modal's money display stays fresh.
- Update the button translation key to "Exchange Treasure" / "Trocar Tesouros" in `en.yaml` and `pt.yaml`.

## Benefits
Makes the treasure exchange modal easier and faster to use: players can find specific treasures quickly, see the highest-value acquire options first, and immediately see whether they can afford something without leaving the modal or guessing at their balance.
