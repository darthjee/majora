import Translator from '../../../../../i18n/Translator.js';
import StaffCopyUrl from '../helpers/StaffCopyUrl.js';

/**
 * Per-copy-type tab bar of the staff copy page.
 *
 * @description Renders one tab link (`#/staff/copies?type=<slug>&from=<from>&to=<to>`, empty
 *   params omitted) per copy type, marking the active one. Following a tab changes the hash,
 *   which remounts the page. Labels come from `staff_copies_page.types.<slug>`, falling back to
 *   the raw slug.
 * @param {object} props - Component props.
 * @param {string[]} props.types - Available copy type slugs.
 * @param {{type: string, from: string, to: string}} props.selection - Current selection.
 * @returns {React.ReactElement} Tab bar element.
 */
export default function StaffCopyTabs({ types, selection }) {
  return (
    <ul className="nav nav-tabs flex-wrap mb-3">
      {types.map((slug) => {
        const active = slug === selection.type;

        return (
          <li key={slug} className="nav-item">
            <a
              className={active ? 'nav-link active' : 'nav-link'}
              aria-current={active ? 'page' : undefined}
              href={`#${StaffCopyUrl.build({ ...selection, type: slug })}`}
            >
              {Translator.t(`staff_copies_page.types.${slug}`, slug)}
            </a>
          </li>
        );
      })}
    </ul>
  );
}
