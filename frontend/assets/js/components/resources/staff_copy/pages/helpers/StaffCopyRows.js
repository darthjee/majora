import Translator from '../../../../../i18n/Translator.js';
import StaffCopyFallbackRow from '../elements/StaffCopyFallbackRow.jsx';
import StaffCopyCommonItemRow from '../elements/rows/StaffCopyCommonItemRow.jsx';
import StaffCopyDocumentRow from '../elements/rows/StaffCopyDocumentRow.jsx';
import StaffCopyFactionRow from '../elements/rows/StaffCopyFactionRow.jsx';
import StaffCopyItemRow from '../elements/rows/StaffCopyItemRow.jsx';
import StaffCopyPossessionRow from '../elements/rows/StaffCopyPossessionRow.jsx';
import StaffCopyRecipeRow from '../elements/rows/StaffCopyRecipeRow.jsx';

const NAME_COLUMN_KEY = 'staff_copies_page.name_column';

/**
 * Registered row renderers, keyed by copy type slug. Each tab issue (#1572–#1577) adds its own
 * entry here — a row component under `elements/rows/` plus the i18n keys of its column headers —
 * so the registration happens at module load, wherever the source list is rendered.
 *
 * @type {Object<string, {component: Function, columns: string[]}>}
 */
const ROWS = {
  items: {
    component: StaffCopyItemRow,
    columns: ['staff_copies_page.photo_column', NAME_COLUMN_KEY, 'staff_copies_page.hidden_column'],
  },
  common_items: {
    component: StaffCopyCommonItemRow,
    columns: [
      'staff_copies_page.photo_column',
      NAME_COLUMN_KEY,
      'staff_copies_page.category_column',
      'staff_copies_page.price_column',
      'staff_copies_page.hidden_column',
    ],
  },
  recipes: {
    component: StaffCopyRecipeRow,
    columns: [NAME_COLUMN_KEY, 'staff_copies_page.common_item_column', 'staff_copies_page.hidden_column'],
  },
  documents: {
    component: StaffCopyDocumentRow,
    columns: [
      'staff_copies_page.photo_column',
      NAME_COLUMN_KEY,
      'staff_copies_page.counts_column',
      'staff_copies_page.hidden_column',
    ],
  },
  possessions: {
    component: StaffCopyPossessionRow,
    columns: ['staff_copies_page.photo_column', NAME_COLUMN_KEY, 'staff_copies_page.hidden_column'],
  },
  factions: {
    component: StaffCopyFactionRow,
    columns: ['staff_copies_page.photo_column', NAME_COLUMN_KEY],
  },
};

/**
 * Slug → row-component registry of the staff copy source list (issue #1571).
 *
 * @description Contract for the tab issues: register `{ [slug]: RowComponent }` (via
 *   {@link StaffCopyRows.register}, or by adding an entry to the `ROWS` literal above), plus the
 *   i18n keys of the column headers that row renders. A row component receives
 *   `{ row, selected, onToggle }` — the source row, whether it is selected and the selection
 *   toggle — and renders **only its own `<td>` cells** (usually as a fragment); the source list
 *   renders the shared selection checkbox cell before them and the shared status cell after
 *   them. Unregistered slugs fall back to {@link StaffCopyFallbackRow}, which renders the row
 *   `name` under the name column.
 */
export default class StaffCopyRows {
  /**
   * Register the row component of a copy type.
   *
   * @param {string} slug - Copy type slug (e.g. `'items'`).
   * @param {Function} component - Row component receiving `{ row, selected, onToggle }` and
   *   rendering its `<td>` cells.
   * @param {string[]} [columns] - i18n keys of the headers of the cells the component renders
   *   (defaults to the name column).
   * @returns {void}
   */
  static register(slug, component, columns = [NAME_COLUMN_KEY]) {
    ROWS[slug] = { component, columns };
  }

  /**
   * Remove the row component registered for a copy type.
   *
   * @param {string} slug - Copy type slug.
   * @returns {void}
   */
  static unregister(slug) {
    delete ROWS[slug];
  }

  /**
   * Resolve the row component of a copy type.
   *
   * @param {string} slug - Copy type slug.
   * @returns {Function} The registered row component, or {@link StaffCopyFallbackRow}.
   */
  static rowFor(slug) {
    return ROWS[slug]?.component ?? StaffCopyFallbackRow;
  }

  /**
   * Resolve the translated headers of the cells the row component of a copy type renders.
   *
   * @param {string} slug - Copy type slug.
   * @returns {string[]} Header labels (the name column for unregistered slugs).
   */
  static columnsFor(slug) {
    const keys = ROWS[slug]?.columns ?? [NAME_COLUMN_KEY];

    return keys.map((key) => Translator.t(key));
  }
}
