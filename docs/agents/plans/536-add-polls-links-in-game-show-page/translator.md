# Translator Plan: Add Polls Links In Game Show Page

Main plan: [plan.md](plan.md)

## Shared contracts

The `frontend` agent will call `Translator.t('<key>')` for every new user-visible string introduced by this issue (the open-polls widget, and the three new poll pages) and will not hardcode English text. Add the corresponding keys to every locale file under `frontend/assets/i18n/` (currently `en.yaml` and `pt.yaml` — keep both in sync, per `npm run check_i18n`).

## Implementation Steps

### Step 1 — Widget keys on the existing `game_page` namespace

Near the existing `next_session_title`/`no_next_session` keys in `en.yaml`'s `game_page:` block:

```yaml
game_page:
  polls_title: Polls
  open_polls_count: "{count} open poll(s)"
  view_polls: View polls
```

(exact interpolation mechanism — `{count}` placeholder vs. two separate singular/plural keys — should match whatever pattern `Translator.t()` already supports elsewhere in this codebase; check for an existing pluralization/interpolation precedent before introducing a new one, and adjust this key shape to match.)

### Step 2 — `game_polls_page` namespace (list)

```yaml
game_polls_page:
  loading: Loading polls...
  title: Polls
  new_poll: New Poll
  empty: No polls yet.
  filter_status_label: Status
  status_open: Open
  status_inactive: Inactive
  status_closed: Closed
  error: Unable to load polls.
```

### Step 3 — `game_poll_page` namespace (detail)

```yaml
game_poll_page:
  loading: Loading poll...
  options_title: Options
  error: Unable to load poll.
```

### Step 4 — `game_poll_new_page` namespace (create form)

```yaml
game_poll_new_page:
  title: New Poll
  title_label: Title
  description_label: Description
  type_label: Type
  type_single: Single choice
  type_multiple: Multiple choice
  options_label: Options
  add_option: Add option
  submit: Create Poll
  error: Failed to create poll. Please try again.
```

Coordinate with the `frontend` agent on the exact key names it ends up referencing in `GamePollsHelper.jsx`/`GamePollHelper.jsx`/`GamePollNewHelper.jsx`/`OpenPollsWidgetHelper.jsx` — this list is a starting proposal, not a hard contract; update this file's key names if the implementation diverges, keeping both locale files in lockstep with the actual `Translator.t()` calls.

### Step 5 — Verify key parity

Run the key-parity check across every locale file after adding the keys.

## Files to Change

- `frontend/assets/i18n/en.yaml` — add the keys above
- `frontend/assets/i18n/pt.yaml` — add the same keys, translated

## CI Checks

- `frontend/`: `docker-compose run --rm majora_fe npm run check_i18n` (CI job: `frontend-checks`)

## Notes

- Do not touch anything outside `frontend/assets/i18n/*.yaml` — component/controller/helper code is `frontend`'s scope.
- Wait for (or coordinate in parallel with) the `frontend` agent's actual `Translator.t()` call sites before finalizing key names, to avoid a mismatch that `check_i18n` won't catch (it only checks cross-locale key parity, not that every key is actually referenced).
