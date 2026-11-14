# Issue: Fix Markdown rendering

## Description

Markdown fields (show pages, the `MarkdownEditor` preview and document pages) do not render GFM tables: the frontend only uses CommonMark plus `remark-breaks`, so the raw pipe text leaks onto the screen. This issue enables GitHub Flavored Markdown (`remark-gfm`) in every Markdown renderer and gives tables proper Bootstrap styling.

The fix applies to **every Markdown field in the application**, not only recipes — recipe 1 of `dragon_heist` is just the example that exposed the bug. All Markdown rendering in the frontend goes through three shared renderers, so fixing them covers every field:

| Renderer | Used by |
| --- | --- |
| `DescriptionBox` → `DescriptionBoxHelper` | descriptions of game, item, common item, possession, document and character document (show-type configs); character public description and DM notes; recipe text sections |
| `MarkdownEditor` → `MarkdownEditorHelper` (Preview tab) | every Markdown edit field: game, item, common item, possession, document (description and pages), character description and DM notes, recipe |
| `DocumentPagesBoxHelper` | document pages |

There is no other Markdown renderer in the frontend (no `marked`, `markdown-it` or `dangerouslySetInnerHTML`). Any future Markdown rendering must use the shared `MarkdownContent` component (see *Scope*).

## Problem

Markdown fields on the show pages do not render GFM tables. The raw pipe text leaks into the screen.

Affected URL: `/#/games/dragon_heist/recipes/1` (field `checks`)
Source JSON: `/games/dragon_heist/recipes/1.json`

## Expected Behavior

- A valid GFM table renders as a styled table (`table table-sm table-bordered`) in **every** Markdown field: all show-page descriptions/text sections, the `MarkdownEditor` **Preview** tab of every edit form, and document pages.
- Wide tables scroll horizontally inside their container instead of being clipped.
- Invalid tables (divider cell count ≠ header cell count) still render as plain text — expected GFM behaviour, and the preview makes it visible to the author.
- Existing content without tables renders as it does today.
- After this ships, the owner fixes recipe 1 of `dragon_heist` manually through the editor.

## Solution

### Cause 1 (root) — `remark-gfm` is not installed

`frontend/package.json` declares `react-markdown@^10.1.0` and only `remark-breaks@^4.0.0`.

`ReactMarkdown` implements **plain CommonMark**. Tables are part of the GFM extension and **do not exist in CommonMark**. Without `remark-gfm` in `remarkPlugins`, the parser treats the pipe block as a regular paragraph and the output is literal.

This is correct from the CommonMark point of view: it is not a library bug, it is missing configuration.

All three rendering points in the project share the same omission:

- `frontend/assets/js/components/common/misc/helpers/DescriptionBoxHelper.jsx` (show)

```jsx
<ReactMarkdown remarkPlugins={[remarkBreaks]}>{description}</ReactMarkdown>
```

- `frontend/assets/js/components/common/forms/helpers/MarkdownEditorHelper.jsx` (edit preview)

```jsx
<ReactMarkdown remarkPlugins={[remarkBreaks]}>{value}</ReactMarkdown>
```

- `frontend/assets/js/components/resources/document/pages/elements/show/helpers/DocumentPagesBoxHelper.jsx` (document pages)

```jsx
<ReactMarkdown remarkPlugins={[remarkBreaks]}>{segment.content}</ReactMarkdown>
```

Consequence: tables also fail to render in the **Preview** tab of `MarkdownEditor`. The author types the table, checks the preview, sees garbage and concludes the syntax is wrong.

#### Proposed fix (sketch — see *Scope*)

```bash
yarn add remark-gfm
```

```jsx
import remarkGfm from 'remark-gfm';

<ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>{text}</ReactMarkdown>
```

Apply to **all three** helpers through a shared `MarkdownContent` component (see *Scope* and *Edge cases*).

### Cause 2 — the stored markdown has invalid syntax

Fixing the plugin alone does not solve it. The current data stays broken. Three distinct defects in the same JSON.

#### 2.1 — Inconsistent column separator (`checks` and `ingredients`)

`checks`, literal:

```
| Rolagem | Quantidade de Poções |
| --------- | ----------------------- |
|    14         |              1                       |
|    15         |              2 |
```

`ingredients`, literal:

```
| Ingrediente | Quantidade |
|---|---|---|---|
```

2 header columns, 4 separators in the divider row. `remark-gfm` requires the separator cell count to match the header. On mismatch the parser **does not** recognize the block as a table and returns a literal paragraph, even with the plugin installed.

#### 2.2 — Table right after a paragraph (`checks`) — probably not a defect

```
Teste de Inteligência (Ferramentas de Alquimista)

| Rolagem | Quantidade de Poções |
```

The stored text does have a blank line between the paragraph and the table. `remark-breaks` is an mdast transform that runs after block parsing (it only turns soft line breaks inside text into `<br>`), so it cannot prevent the table block from being recognised. Expected outcome: the table renders once `remark-gfm` is active. This is still validated locally (see Checklist); if it does not render, the cause lies elsewhere than `remark-breaks` and is investigated within this issue.

#### 2.3 — Missing trailing pipe (`ingredients`) — not a defect

```
| Água fresca de fonte de templo | 25 ml
```

The line ends without a `|`. GFM explicitly allows rows without outer pipes, so this row renders correctly as long as the table itself is recognised. The only real defect in `ingredients` is 2.1.

#### Data fix

There is no code fix for this. It is content. It must be re-edited with valid GFM syntax:

```
| Rolagem | Quantidade de Poções |
| ------- | -------------------- |
| 14      | 1                    |
| 15      | 2                    |
```

```
| Ingrediente | Quantidade |
| ----------- | ---------- |
```

### Full example of the problematic data

JSON of recipe 1 (Poção de Cura) from the game `dragon_heist`. Field `checks` exactly as stored today:

```
Teste de Inteligência (Ferramentas de Alquimista)

| Rolagem | Quantidade de Poções |
| --------- | ----------------------- |
|    14         |              1                       |
|    15         |              2 |
|    16         |              3                       |
|    18         |              4                       |
|    20         |              5                       |
|    22         |              6                       |
```

Field `ingredients` exactly as stored today:

```
## INGREDIENTES

20 PO por unidade de poção

| Ingrediente | Quantidade |
|---|---|---|---|
| Álcool etílico destilado | 40ml |
| Mel de flores silvestres | 15 g |
| Água fresca de fonte de templo | 25 ml
| Glicerina vegetal | 5 ml |
| Raiz de consolda em pó | 10 g |
| Raspas de casca de salgueiro-branco | 8 g |
| Própolis bruto | 3 g |
| Orvalho de Rosa-de-Ilmater | 12 gotas (1 dose) |
| Sal de templo consagrado | 1 pitada |
```

### Decisions

1. ~~Migration script vs manual fix?~~ **Decided: manual.** The owner re-edits the broken content through the editor once the preview renders tables. No migration, no audit script.
2. ~~"Insert table" toolbar button?~~ **Decided: spun off to #1778.**
3. ~~Full GFM or tables only?~~ **Decided: full GFM** (see *Alternative solutions*).

### Alternative solutions

CommonMark has no tables, so a GFM table parser is required either way. Options considered:

- **A — `remark-gfm` (full GFM). Chosen.** One official plugin, the standard pairing for `react-markdown` v10. It also enables autolink literals, `~~strikethrough~~`, task-list checkboxes (rendered read-only) and footnotes; these are accepted as harmless or useful for a campaign manager. Raw HTML stays escaped (no `rehype-raw`).
- B — tables-only plugin assembled from `micromark-extension-gfm-table` + `mdast-util-gfm-table`. Rejected: custom glue to maintain and low-level packages to keep version-aligned, to avoid features the product does not object to.
- C — `remark-gfm` + `disallowedElements` to hide unwanted features. Rejected: cannot suppress autolinks without also stripping real links.
- D — raw HTML tables via `rehype-raw`. Rejected: opens an XSS surface on user-authored content.
- E — replace the renderer (e.g. markdown-it). Rejected: rewrites three components for one feature.

`remark-breaks` is kept: authors rely on single newlines becoming line breaks. Its interaction with tables (case 2.2) is covered by the local validation step.

### Edge cases

- **Divider cell count ≠ header cell count** (2.1): GFM falls back to a plain paragraph for the whole block. Not fixable in the renderer; it is a content problem (manual fix, see *Scope*).
- **Body rows with fewer/more cells than the header**: tolerated by GFM — missing cells are padded, extra cells dropped. No action.
- **Missing outer pipes** (2.3): valid GFM. No action.
- **Table right after a paragraph** (2.2): expected to work; validated locally.
- **Unstyled tables**: Bootstrap only styles `<table>` elements carrying the `.table` class, so a bare GFM table renders with no borders or padding.
- **Wide tables**: `DescriptionBoxHelper` wraps content in `overflow: hidden`, so a wide table is clipped horizontally (worst on mobile).
- **Literal pipe inside a cell**: must be escaped as `\|`. Standard GFM behaviour; no action.

The last two styling cases are handled through `react-markdown`'s `components` prop: `table` renders as `<div className="table-responsive"><table className="table table-sm table-bordered">…</table></div>`, defined once in the shared configuration so all three renderers get it.

### Backward compatibility

- No backend, API or stored-data change; rollback is a plain revert of the frontend change.
- Enabling full GFM changes how some syntax renders: autolink literals become links, `~text~` / `~~text~~` become strikethrough, `- [ ]` becomes a disabled checkbox, `[^1]` becomes a footnote. The owner confirmed that no production content currently uses any of these, so existing content renders the same except for the (intended) tables.
- `remark-gfm` is used with its default options.
- Link behaviour is unchanged: autolinks, like explicit `[text](url)` links today, open in the same tab. Opening external links in a new tab is out of scope.

### Performance & security

#### Performance

- Bundle: `remark-gfm` and its micromark/mdast GFM extensions add roughly 10 KB gzipped. Accepted in the main bundle; no lazy loading (Markdown renders on most show pages).
- Render cost: same parse pass with a few extra tokenizers; negligible for this content size.
- Navi cache: unaffected — frontend-only change, API responses are identical.
- `DescriptionBox` collapse: overflow detection measures rendered height; a rendered table is usually shorter than the former literal paragraph. Covered by the existing behaviour and the new specs.

#### Security

- Raw HTML stays escaped: `react-markdown` drops HTML unless `rehype-raw` is added.
- Dangerous link schemes (`javascript:`, `data:`, …) are stripped by `react-markdown`'s default `urlTransform`, autolinks included. Autolink literals only match `http(s)://`, `www.` and email addresses.
- `remark-gfm` prefixes footnote ids with `user-content-`, preventing DOM clobbering.
- No new endpoint, permission or proxy change: no `security` / `data-access` review needed.

#### Constraints

- Do not add `rehype-raw` (or any plugin that lets raw HTML through).
- Do not override `urlTransform`.
- The `table` override in `components` only adds the wrapper and classes, passing children through unchanged.

### Scope

#### In scope

- Add `remark-gfm` to `frontend/package.json`.
- Enable it in **all three** `ReactMarkdown` rendering points:
  - `DescriptionBoxHelper.jsx` (show pages);
  - `MarkdownEditorHelper.jsx` (editor preview);
  - `DocumentPagesBoxHelper.jsx` (document pages) — missing from the original analysis.
- Create a shared **`MarkdownContent`** component (e.g. `frontend/assets/js/components/common/misc/MarkdownContent.jsx`) that wraps `ReactMarkdown` with `remarkPlugins={[remarkGfm, remarkBreaks]}` and the `table` override in `components`. The three renderers render `<MarkdownContent>{text}</MarkdownContent>` instead of calling `ReactMarkdown` directly, so they cannot drift again.
- Render tables with Bootstrap styling inside a horizontally scrollable wrapper (`table-responsive` + `table table-sm table-bordered`), via the `components` prop of `MarkdownContent`.
- Jasmine specs for `MarkdownContent`: a GFM table renders as `<table>` with the Bootstrap classes inside the responsive wrapper; line breaks still render (`remark-breaks`); a `[x](javascript:alert(1))` link renders without a `javascript:` `href`.
- Each of the three helper specs checks that a GFM table renders as `<table>` (proves the helper uses `MarkdownContent`).
- Validate case 2.2 (table without a blank line before it, under `remark-breaks`); if it does not render, fixing it in the renderer/plugin config is in scope.

#### Out of scope

- Fixing stored content (`checks` / `ingredients` of recipe 1 in `dragon_heist`, and any other field): done manually by the owner through the editor once the preview works.
- Any migration or audit script over existing markdown fields.
- The "insert table" toolbar action — tracked in #1778.
- Backend changes: the content is stored and served as-is.

### File scope

```
frontend/package.json                                              (+ remark-gfm)
frontend/assets/js/components/common/misc/MarkdownContent.jsx      (new)
frontend/assets/js/components/common/misc/helpers/DescriptionBoxHelper.jsx
frontend/assets/js/components/common/forms/helpers/MarkdownEditorHelper.jsx
frontend/assets/js/components/resources/document/pages/elements/show/helpers/DocumentPagesBoxHelper.jsx
```

### Checklist

- [ ] `yarn add remark-gfm`
- [ ] Create `MarkdownContent` (`remarkGfm` + `remarkBreaks`, `table` override with `table-responsive` wrapper and `table table-sm table-bordered` classes)
- [ ] Replace the direct `ReactMarkdown` calls in `DescriptionBoxHelper.jsx`, `MarkdownEditorHelper.jsx` and `DocumentPagesBoxHelper.jsx` with `MarkdownContent`
- [ ] `MarkdownContent` spec: table, line breaks, `javascript:` link (`frontend/specs/...` mirrors `assets/js/`)
- [ ] Each helper spec: a GFM table renders as `<table>`
- [ ] Validate 2.2 locally: with `remark-gfm` active, the `checks` table (paragraph, blank line, table) renders as a table. If it does not, investigate the cause within this issue.
- [ ] (Owner, manual, after deploy) Fix `checks` and `ingredients` of recipe 1 in `dragon_heist` through the editor

### Responsible agents

frontend. No backend, proxy or cache change.
