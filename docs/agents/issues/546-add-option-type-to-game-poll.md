# Issue: Add option type to Game Poll

## Description
Game polls currently render every option as plain text and edit every option as a plain text input. We want to add an "option type" attribute to polls so that options can be entered and displayed differently depending on their type — starting with `text` (current behavior, default) and `date` (a native date picker for input, formatted as a proper date for display). This will be useful for polls used to pick a game session date, and is designed to accommodate more option types in the future.

## Problem
There is no way to mark a poll's options as representing dates rather than free text, so date-based polls are edited and shown as raw, unformatted strings (e.g. `2026-08-01`) instead of using a proper date picker and a formatted date display.

## Expected Behavior
- A poll gains an "option type" attribute, set once per poll (applies to all of its options), with values `text` (default) and `date`.
- On the New Poll form (`/#/games/dragon_heist/polls/new`), a select for the option type is added after the Description field, defaulting to `text`.
- The option input fields on that form render through a specialized, type-aware component: a plain text input for `text`, a native date picker for `date`. This component is the single place that knows how to render each type, so adding a new option type later only means extending it.
- On the Poll page (`/#/games/dragon_heist/polls/:id`), each option value (`option.option`) is rendered through a matching type-aware component: `text` shown normally, as today; `date` formatted as a proper date.

## Solution
- Backend: add an `option_type` field (choices `text`/`date`, default `text`) to the `Poll` model, following the existing `TYPE_CHOICES`-constant pattern used elsewhere in the codebase (e.g. `Poll.TYPE_CHOICES`, `Game.GAME_TYPE_CHOICES`), plus a migration.
- Backend: expose `option_type` on the relevant Poll serializers (create/read).
- Frontend: add a select to `GamePollNew.jsx` (after the Description field) to choose the option type.
- Frontend: introduce a specialized option-input component used by `GamePollNew.jsx` that switches between a text input and a native date picker (`<input type="date">`) based on the poll's option type, structured so future types can be added by extending it rather than branching ad hoc.
- Frontend: introduce a matching specialized option-display component used by `GamePoll.jsx` that formats the option value based on the poll's option type, structured the same extensible way.

## Benefits
Enables date-based polls (e.g. choosing the next game session date) to be filled in with a proper date picker and displayed as a properly formatted date instead of a raw string, and establishes a reusable, extensible pattern for adding further option types in the future.
