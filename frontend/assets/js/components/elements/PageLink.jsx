import React from 'react';

/**
 * Generic pagination link rendered from a URL template.
 *
 * @param {object} props - Component props.
 * @param {string} props.urlTemplate - URL template with `:page` and `:perPage` placeholders.
 * @param {number} props.page - Page number to substitute.
 * @param {number} props.perPage - Items per page to substitute.
 * @param {string} [props.ariaLabel] - Optional accessible label.
 * @param {React.ReactNode} props.children - Link content.
 * @returns {React.ReactElement} Anchor element.
 */
export default function PageLink({ urlTemplate, page, perPage, ariaLabel = undefined, children }) {
  return (
    <a
      className="page-link"
      href={urlTemplate.replace(':page', page).replace(':perPage', perPage)}
      aria-label={ariaLabel}
    >
      {children}
    </a>
  );
}
