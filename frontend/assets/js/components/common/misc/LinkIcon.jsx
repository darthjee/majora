import React from 'react';
import lootstudioIcon from '../../../../images/links/lootstudio.png';
import Icons from '../../../utils/ui/Icons.js';

export const LINK_TYPE_ICONS = {
  lootstudio: lootstudioIcon,
};

export const LINK_TYPE_BOOTSTRAP_ICONS = {
  diary: Icons.feather,
  music: Icons.musicNoteList,
  stl: Icons.box,
  background: Icons.bookHalf,
  reference: Icons.bookmarkStarFill,
};

export const LINK_TYPES = [...Object.keys(LINK_TYPE_ICONS), ...Object.keys(LINK_TYPE_BOOTSTRAP_ICONS)];

/**
 * Resolve the icon image URL to render for a given link type.
 * Returns null when the type is falsy or not recognized as an image type,
 * meaning the generic chain icon or a Bootstrap icon should be used instead.
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
 * matches an image type, a type-specific Bootstrap icon when it matches a
 * Bootstrap-icon type, or the generic chain Bootstrap icon otherwise.
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

  const bootstrapIconClass = linkType && LINK_TYPE_BOOTSTRAP_ICONS[linkType];

  if (bootstrapIconClass) {
    return <i className={`bi ${bootstrapIconClass}`}></i>;
  }

  return <i className="bi bi-link-45deg"></i>;
}
