import React from 'react';
import lootstudioIcon from '../../../images/links/lootstudio.png';

const LINK_TYPE_ICONS = {
  lootstudio: lootstudioIcon,
};

/**
 * Resolve the icon image URL to render for a given link type.
 * Returns null when the type is falsy or not recognized, meaning
 * the generic chain icon should be used instead.
 *
 * @param {string} [linkType] - The link's `link_type` value.
 * @returns {string|null} Icon image URL, or null for the fallback icon.
 */
function resolveLinkIcon(linkType) {
  if (!linkType) return null;

  return LINK_TYPE_ICONS[linkType] || null;
}

/**
 * Renders the icon for a single link: a type-specific image when `linkType`
 * is recognized, or the generic chain Bootstrap icon otherwise.
 *
 * @param {object} props - Component props.
 * @param {string} [props.linkType] - The link's `link_type` value.
 * @returns {React.ReactElement} Icon element.
 */
export default function LinkIcon({ linkType }) {
  const iconUrl = resolveLinkIcon(linkType);

  if (iconUrl) {
    return <img src={iconUrl} alt={linkType} height="16" className="align-text-bottom" />;
  }

  return <i className="bi bi-link-45deg"></i>;
}
