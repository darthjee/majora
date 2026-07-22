import React from 'react';
import PageActions from '../list_page/PageActions.jsx';
import showTypeConfig from './show_types/showTypeConfig.js';

const MODE_KEYS = { show: 'Show', new: 'New', edit: 'Edit' };

/**
 * Resolve which component a single slot entry renders for the current mode. A plain component
 * (a function) is used as-is in every mode. A mode-variant object (`{Show, New, Edit}`) is
 * looked up by the current mode's key; a mode not declared on the object renders nothing for
 * that mode (no implicit fallback), so resources with mode-specific content (e.g. a page with
 * no left-side content on its `new` form) simply omit that mode's key.
 *
 * @param {Function|object} entry - Slot entry declared in `showTypeConfig`.
 * @param {'show'|'new'|'edit'} mode - Current page mode.
 * @returns {Function|null} The component to render, or `null` when this entry has nothing for
 *   the current mode.
 */
function resolveComponent(entry, mode) {
  if (typeof entry === 'function') return entry;

  return entry[MODE_KEYS[mode]] ?? null;
}

/**
 * Render one layout slot (left/right/bottom) from its configured entries.
 *
 * @param {Array<Function|object>} entries - Slot entries declared in `showTypeConfig`.
 * @param {'show'|'new'|'edit'} mode - Current page mode.
 * @param {object} context - Rendering context, spread as props into every rendered entry.
 * @returns {React.ReactElement[]} Rendered slot entries (mode-less entries render as `null`).
 */
function renderSlot(entries, mode, context) {
  return entries.map((entry, index) => {
    const Component = resolveComponent(entry, mode);

    return Component ? <Component key={index} {...context} /> : null;
  });
}

/**
 * Shared left/right/bottom layout shell for show, new, and edit pages, mirroring the
 * `ListPage`/`listTypeConfig` pattern already used for index pages. The owning page supplies a
 * `type` (key into `showTypeConfig`) and a `mode`; the slot components declared for that type
 * render into the left column, right column, and below the split, picking the entry matching
 * the current mode. Each rendered component is responsible for its own show/hide logic.
 *
 * @param {object} props - Component props.
 * @param {string} props.type - Show type, a key into `showTypeConfig`.
 * @param {'show'|'new'|'edit'} [props.mode] - Current page mode; defaults to `'show'`.
 * @param {string} [props.backHref] - Hash path for the back button. `PageActions` (and its
 *   back button) is omitted entirely when not given, matching pages with no back navigation.
 * @param {React.ReactNode} [props.pageActions] - Action buttons rendered inside `PageActions`
 *   (e.g. an Edit button on a show page).
 * @param {object} [props.context] - Rendering context (fetched entity data on show pages, or
 *   form state on new/edit pages, plus `handlers` and any extra per-page values), spread as
 *   props into every configured slot component.
 * @returns {React.ReactElement} Rendered page layout.
 */
export default function ShowPageLayout({
  type, mode = 'show', backHref, pageActions, context = {},
}) {
  const config = showTypeConfig[type];
  const slotContext = { ...context, mode };
  const body = (
    <>
      {backHref && <PageActions backHref={backHref}>{pageActions}</PageActions>}
      <div className="row">
        <div className="col-md-4">{renderSlot(config.left ?? [], mode, slotContext)}</div>
        <div className="col-md-8">{renderSlot(config.right ?? [], mode, slotContext)}</div>
      </div>
      {renderSlot(config.bottom ?? [], mode, slotContext)}
    </>
  );

  if (mode === 'show') {
    return <div className="container mt-4">{body}</div>;
  }

  return (
    <form className="container mt-4" onSubmit={slotContext.handlers?.onSubmit}>
      {body}
    </form>
  );
}
