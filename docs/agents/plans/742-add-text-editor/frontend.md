# Frontend Plan: Add text editor

Main plan: [plan.md](plan.md)

## Shared contracts

Reference `Translator.t('markdown_editor.<key>')` for these keys (translator agent adds them
to `en.yaml`/`pt.yaml`): `write_tab`, `preview_tab`, `bold`, `italic`, `heading`,
`bulleted_list`, `numbered_list`, `link`, `preview_empty`. See [plan.md](plan.md)'s "Shared
contracts" for the full block. Missing keys don't break the build (`Translator.t` falls back
to the key itself), so frontend work can proceed independently, but both changes must land in
the same PR for `npm run check_i18n` to stay green.

## Context

Every description-like field goes through the shared `TextareaField` component
(`frontend/assets/js/components/common/forms/TextareaField.jsx`), a plain `<textarea>`. The
corresponding show page renders the same value as Markdown via the shared `DescriptionBox`
(`frontend/assets/js/components/common/misc/DescriptionBox.jsx`) →
`DescriptionBoxHelper.jsx`, which uses `ReactMarkdown` with `remarkBreaks`. `TextareaField` is
used, with an identical `{ id, label, value, onChange, errors }` call signature, by exactly
four wrapper components:

- `components/resources/game/pages/elements/show/GameDescriptionField.jsx` (games new/edit)
- `components/resources/item/pages/elements/show/ItemDescriptionField.jsx` (game/pc/npc items
  new/edit)
- `components/resources/character/pages/elements/helpers/CharacterDescriptionFieldHelper.jsx`
  (pc/npc description, new/edit)
- `components/resources/character/pages/elements/helpers/CharacterDmNotesFieldHelper.jsx`
  (pc/npc DM notes, new/edit)

Because all four already pass the same prop set, a new component with the same signature is a
true drop-in replacement — no changes needed to any of their callers or to
`CharacterDescriptionField.jsx`/`CharacterDmNotesField.jsx` (the thin public wrappers around
the two character helpers above).

`bootstrap-icons` is already a dependency (see `LinkIcon.jsx` for the `<i className="bi
bi-...">` pattern), so toolbar icons need no new dependency. `react-markdown` +
`remark-breaks` are already dependencies too — reuse them for the preview pane instead of
adding an editor package.

This codebase's convention for a stateful, non-trivial UI element is a thin stateful
`X.jsx` component holding `useState`/refs and delegating pure rendering to a static
`XHelper.render(...)` class (see `DescriptionBox.jsx` / `DescriptionBoxHelper.jsx`, and
`CharacterDescriptionField.jsx` / `CharacterDescriptionFieldHelper.jsx`). Follow the same
split here. Pure JS logic unrelated to rendering (e.g. computing the new textarea value after
a toolbar action) belongs in a static utility class under `frontend/assets/js/utils/` (see
`Noop.js`, `groupBy.js`, `parsePositiveInt.js`), so it's directly unit-testable without
touching React at all.

Tests in this codebase render with `renderToStaticMarkup` (no jsdom) and, for
click/interaction behavior, call the captured `onClick`/handler function directly rather than
simulating real DOM events (see `DescriptionBoxHelperSpec.js`'s
`button.props.onClick()` and `DescriptionBoxSpec.js`'s `spyOn(DescriptionBoxHelper, 'render')`
pattern of asserting on the state/handlers passed into the helper). Follow this same pattern —
no jsdom, no `fireEvent`/`act`.

## Implementation Steps

### Step 1 — Markdown syntax insertion utility

Create `frontend/assets/js/utils/MarkdownSyntax.js`, a static utility class (like `Noop.js`)
with one method per toolbar action (or a single `apply(action, value, selectionStart,
selectionEnd)` dispatcher — pick whichever keeps each action's logic simplest). Given the
current textarea `value` and the selection range, each action returns the new `value` plus the
new cursor/selection position, e.g.:

- **Bold/italic**: wrap the selected text in `**`/`*` (or insert an empty pair and place the
  cursor between them when nothing is selected).
- **Heading**: prefix the current line with `## `.
- **Bulleted/numbered list**: prefix the current line with `- ` / `1. `.
- **Link**: wrap the selection as `[selection](url)` (or insert a `[link](url)` placeholder
  when nothing is selected).

Keep this pure and framework-free — it only takes/returns strings and numbers, no DOM or React
types — so Step 4's spec can test it directly.

### Step 2 — `MarkdownEditorHelper` (pure rendering)

Create `frontend/assets/js/components/common/forms/helpers/MarkdownEditorHelper.jsx`, a static
`render(id, label, value, errors, state, handlers)` class mirroring
`DescriptionBoxHelper.render`'s shape. Renders, inside the same `mb-3`/`form-label` wrapper as
`TextareaField`:

- A toolbar (`bi bi-*` icon buttons, `aria-label`/`title` from the `markdown_editor.*` keys)
  that calls `handlers.onToolbarAction('<actionName>')` for each button, only shown/enabled in
  the `'write'` tab.
- A "Write"/"Preview" tab pair (`markdown_editor.write_tab`/`markdown_editor.preview_tab`)
  toggled via `handlers.onTabChange`, following the same
  active/inactive `btn`/`btn-link` styling already used for the show/less toggle in
  `DescriptionBoxHelper`.
- In `'write'` mode: the `<textarea id={id} className="form-control" ref={handlers.textareaRef}
  value={value} onChange={handlers.onChange}>` (same `id`/`className` as today, so existing
  `htmlFor`/CSS keeps working).
- In `'preview'` mode: `<ReactMarkdown remarkPlugins={[remarkBreaks]}>{value}</ReactMarkdown>`
  (same as `DescriptionBoxHelper`), or the `markdown_editor.preview_empty` message when `value`
  is blank.
- `<FieldErrors errors={errors} />` at the bottom, same as `TextareaField`.

### Step 3 — `MarkdownEditor` (stateful wrapper)

Create `frontend/assets/js/components/common/forms/MarkdownEditor.jsx`, exporting
`MarkdownEditor({ id, label, value, onChange, errors = [] })` — same signature as
`TextareaField`. Holds:

- `activeTab` state (`'write'` default), toggled by `onTabChange`.
- A `textareaRef` (`useRef(null)`).
- `onToolbarAction(action)`: reads `textareaRef.current.selectionStart`/`selectionEnd`/`value`,
  calls `MarkdownSyntax` (Step 1) to compute the new value/selection, calls `onChange` with a
  synthetic-enough event shape matching what the existing `onChange` handlers already expect
  (check `handlers.onDescriptionChange` call sites — they read `event.target.value`; construct
  `{ target: { value: newValue } }` or reuse the real textarea node by writing `.value` then
  dispatching, whichever keeps the diff smaller), then restores focus/selection on the textarea
  after React re-renders (`textareaRef.current.focus()` /
  `setSelectionRange(newStart, newEnd)`).
- Delegates rendering to `MarkdownEditorHelper.render(id, label, value, errors, { activeTab },
  { onChange, onTabChange, onToolbarAction, textareaRef })`.

### Step 4 — Swap `TextareaField` for `MarkdownEditor` in the four wrappers

In each of the four files listed in "Context" above, replace the `TextareaField` import and
usage with `MarkdownEditor`, passing through the exact same props — no other changes needed in
these files (no caller of these four components needs to change).

### Step 5 — Specs

- `frontend/specs/assets/js/utils/MarkdownSyntaxSpec.js` — unit tests for every action in Step
  1 (wrap/unwrap selected text, line-prefix actions, cursor placement when nothing is
  selected), pure function calls, no React.
- `frontend/specs/assets/js/components/common/forms/helpers/MarkdownEditorHelperSpec.js` —
  mirror `DescriptionBoxHelperSpec.js`'s style: build fake `state`/`handlers` objects, assert
  on the rendered `renderToStaticMarkup` output (toolbar buttons present, write vs preview
  markup, `FieldErrors` wiring, `id`/`for` linkage) and invoke captured `onClick`/`onChange`
  props directly to assert the right handler was called with the right args.
- `frontend/specs/assets/js/components/common/forms/MarkdownEditorSpec.js` — mirror
  `DescriptionBoxSpec.js`'s style: `spyOn(MarkdownEditorHelper, 'render')` and assert on the
  `state`/`handlers` it's called with (e.g. `activeTab` starts at `'write'`,
  `onToolbarAction`/`onTabChange` don't throw when invoked with a stubbed `textareaRef`).
- Update the four existing wrapper specs (`GameDescriptionFieldSpec.js`,
  `ItemDescriptionFieldSpec.js`, `CharacterDescriptionFieldHelperSpec.js`,
  `CharacterDmNotesFieldHelperSpec.js` — find via `find frontend/specs -iname
  '*DescriptionField*Spec.js' -o -iname '*DmNotesField*Spec.js'`) to assert they now render
  `MarkdownEditor` instead of `TextareaField`, keeping the rest of each spec's assertions
  (id/label/errors wiring) intact.

## Files to Change

- `frontend/assets/js/utils/MarkdownSyntax.js` — new, pure toolbar-action logic.
- `frontend/assets/js/components/common/forms/helpers/MarkdownEditorHelper.jsx` — new, static
  rendering (toolbar, write/preview tabs, textarea, errors).
- `frontend/assets/js/components/common/forms/MarkdownEditor.jsx` — new, stateful wrapper,
  same prop contract as `TextareaField`.
- `frontend/assets/js/components/resources/game/pages/elements/show/GameDescriptionField.jsx`
  — swap `TextareaField` → `MarkdownEditor`.
- `frontend/assets/js/components/resources/item/pages/elements/show/ItemDescriptionField.jsx`
  — swap `TextareaField` → `MarkdownEditor`.
- `frontend/assets/js/components/resources/character/pages/elements/helpers/CharacterDescriptionFieldHelper.jsx`
  — swap `TextareaField` → `MarkdownEditor`.
- `frontend/assets/js/components/resources/character/pages/elements/helpers/CharacterDmNotesFieldHelper.jsx`
  — swap `TextareaField` → `MarkdownEditor`.
- New/updated specs as listed in Step 5.

## CI Checks

- `frontend`: `npm test` (or `npm run coverage`) (CI job: `jasmine`)
- `frontend`: `npm run lint` (CI job: `frontend-checks`)
- `frontend`: `npm run check_i18n` (CI job: `frontend-checks`) — will fail until the translator
  agent's `markdown_editor.*` keys land in both `en.yaml` and `pt.yaml`.

## Notes

- `TextareaField.jsx` itself is left untouched — it may still be used elsewhere for genuinely
  plain-text fields; only the four description/DM-notes call sites are swapped.
- Keep the toolbar action set minimal (bold, italic, heading, bulleted list, numbered list,
  link) — matches the "Custom toolbar + textarea + live preview" approach agreed in the issue,
  not a full WYSIWYG editor.
- Double-check `handlers.onDescriptionChange`'s expected event shape (used by all four
  wrappers) before wiring `onToolbarAction`'s synthetic change — it must stay a drop-in
  `onChange` from the wrappers' point of view.
