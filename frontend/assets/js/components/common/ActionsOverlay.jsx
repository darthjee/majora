import React from 'react';
import CardPhoto from './CardPhoto.jsx';
import CardAvatar from './CardAvatar.jsx';
import CardTreasureImage from './CardTreasureImage.jsx';
import ActionBar from './ActionBar.jsx';
import InfoBar from './InfoBar.jsx';

const PHOTO_COMPONENTS = {
  avatar: CardAvatar,
  treasure: CardTreasureImage,
};

/**
 * Wraps a photo/avatar with a hover-reveal overlay hosting the photo-upload
 * button and any secondary action buttons.
 *
 * @description Renders the underlying photo/avatar unconditionally, and
 *   delegates the upload button and any secondary overlay action buttons
 *   (e.g. Slain/Revive) to {@link ActionBar}.
 * @param {object} props - Component props.
 * @param {'photo'|'avatar'|'treasure'} [props.type] - Which underlying image component to
 *   render: `'avatar'` uses {@link CardAvatar}, `'treasure'` uses
 *   {@link CardTreasureImage}, anything else (default) uses {@link CardPhoto}.
 * @param {string|null} [props.url] - Image URL, or null/undefined to use the default photo.
 * @param {string} props.alt - Alt text for the image.
 * @param {boolean} [props.canEdit] - Whether the current user may upload a new photo.
 * @param {Function} props.onClick - Handler invoked when the upload button is clicked.
 * @param {boolean} [props.grayscale] - Whether to render the photo in grayscale.
 * @param {{label: string, variant: string, icon: string, onClick: Function}[]} [props.secondaryButtons] - Optional
 *   secondary overlay buttons (e.g. real/public Slain-Revive), stacked at the bottom right,
 *   rendered when the primary upload button is present on the left.
 * @param {object[]} [props.infoBarItems] - Optional informational (non-interactive) items
 *   rendered in the always-visible {@link InfoBar} at the top of the overlay.
 * @returns {React.ReactElement} Rendered photo/avatar with optional upload/secondary overlay buttons.
 */
export default function ActionsOverlay({
  type, url, alt, canEdit, onClick, grayscale = false, secondaryButtons = [], infoBarItems = [],
}) {
  const Photo = PHOTO_COMPONENTS[type] || CardPhoto;
  const className = `actions-overlay${grayscale ? ' photo-grayscale' : ''}`;

  return (
    <div className={className}>
      <Photo url={url} alt={alt} />
      <InfoBar items={infoBarItems} />
      <ActionBar canEdit={canEdit} onClick={onClick} secondaryButtons={secondaryButtons} />
    </div>
  );
}
