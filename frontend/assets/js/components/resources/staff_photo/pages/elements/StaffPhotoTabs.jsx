import StaffPhotoTypes from '../helpers/StaffPhotoTypes.js';

/**
 * Per-photo-type tab bar of the staff photos page.
 *
 * @description Renders one tab link (`#/staff/photos?type=<slug>`) per available photo type,
 *   marking the active one. Following a tab changes the hash, which remounts the page.
 * @param {object} props - Component props.
 * @param {string[]} props.types - Available photo type slugs.
 * @param {string|null} props.activeType - Currently active photo type slug.
 * @returns {React.ReactElement} Tab bar element.
 */
export default function StaffPhotoTabs({ types, activeType }) {
  return (
    <ul className="nav nav-tabs flex-wrap mb-3">
      {types.map((slug) => {
        const active = slug === activeType;

        return (
          <li key={slug} className="nav-item">
            <a
              className={active ? 'nav-link active' : 'nav-link'}
              aria-current={active ? 'page' : undefined}
              href={`#/staff/photos?type=${slug}`}
            >
              {StaffPhotoTypes.label(slug)}
            </a>
          </li>
        );
      })}
    </ul>
  );
}
