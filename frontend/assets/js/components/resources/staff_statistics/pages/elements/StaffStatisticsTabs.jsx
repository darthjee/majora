import StatisticsTabs, { STATISTICS_TABS } from '../helpers/StatisticsTabs.js';
import statisticsHref from '../helpers/statisticsHref.js';

/**
 * Tab nav of the access statistics page.
 *
 * @description Same markup as `StaffPhotoTabs.jsx`, but every `href` carries the current
 *   filters (via `statisticsHref`), so switching tabs keeps them, while `page` / `per_page` /
 *   `sort` are dropped.
 * @param {object} props - Component props.
 * @param {string} props.activeTab - Key of the active tab.
 * @param {object} props.filters - Current statistics filters.
 * @returns {React.ReactElement} Tab nav element.
 */
export default function StaffStatisticsTabs({ activeTab, filters }) {
  return (
    <ul className="nav nav-tabs flex-wrap mb-3" data-testid="statistics-tabs">
      {STATISTICS_TABS.map((tab) => {
        const active = tab.key === activeTab;

        return (
          <li key={tab.key} className="nav-item">
            <a
              className={active ? 'nav-link active' : 'nav-link'}
              aria-current={active ? 'page' : undefined}
              href={`#${statisticsHref(tab.path, filters)}`}
            >
              {StatisticsTabs.label(tab)}
            </a>
          </li>
        );
      })}
    </ul>
  );
}
