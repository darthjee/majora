import React from 'react';
import CardPhoto from './CardPhoto.jsx';
import CardAvatar from './CardAvatar.jsx';
import CardTreasureImage from './CardTreasureImage.jsx';
import Translator from '../../i18n/Translator.js';
import Icons from '../../utils/Icons.js';

const PHOTO_COMPONENTS = {
  avatar: CardAvatar,
  treasure: CardTreasureImage,
};

const SECONDARY_BUTTON_POSITION_CLASSES = [
  'actions-overlay-button-right',
  'actions-overlay-button-right-2',
];

/**
 * Render the primary upload button, using the centered modifier class when
 * no secondary button is present, or the left modifier class when it is.
 *
 * @param {boolean} canEdit - Whether the current user may upload a new photo.
 * @param {Function} onClick - Handler invoked when the upload button is clicked.
 * @param {boolean} hasSecondaryButtons - Whether secondary buttons will also be rendered.
 * @returns {React.ReactElement|null} Upload button element, or null when canEdit is false.
 */
function renderUploadButton(canEdit, onClick, hasSecondaryButtons) {
  if (!canEdit) {
    return null;
  }

  const modifierClass = hasSecondaryButtons
    ? 'actions-overlay-button-left'
    : 'actions-overlay-button';
  const label = Translator.t('photo_upload_modal.title');

  return (
    <button
      type="button"
      className={`btn btn-secondary ${modifierClass}`}
      onClick={onClick}
      aria-label={label}
      title={label}
    >
      <i className={`bi ${Icons.camera}`} aria-hidden="true"></i>
    </button>
  );
}

/**
 * Render the optional secondary overlay buttons (e.g. Slain/Revive), stacked
 * at the bottom-right of the overlay.
 *
 * @param {{label: string, variant: string, icon: string, onClick: Function}[]} secondaryButtons - Secondary
 *   button definitions (0-2 entries).
 * @returns {React.ReactElement[]} Secondary button elements.
 */
function renderSecondaryButtons(secondaryButtons) {
  return secondaryButtons.map((secondaryButton, index) => (
    <button
      key={secondaryButton.label}
      type="button"
      className={`btn btn-${secondaryButton.variant} ${SECONDARY_BUTTON_POSITION_CLASSES[index]}`}
      onClick={secondaryButton.onClick}
      aria-label={secondaryButton.label}
      title={secondaryButton.label}
    >
      <i className={`bi ${secondaryButton.icon}`} aria-hidden="true"></i>
    </button>
  ));
}

/**
 * Wraps a photo/avatar with a hover-reveal overlay hosting the photo-upload
 * button and any secondary action buttons.
 *
 * @description Renders the underlying photo/avatar unconditionally, but only
 *   renders the upload button when `canEdit` is true — for users without edit
 *   access the button is omitted entirely, not just disabled. Optionally
 *   renders the photo in grayscale and/or up to two secondary overlay action
 *   buttons (e.g. Slain/Revive) alongside the upload button.
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
 * @returns {React.ReactElement} Rendered photo/avatar with optional upload/secondary overlay buttons.
 */
export default function ActionsOverlay({
  type, url, alt, canEdit, onClick, grayscale = false, secondaryButtons = [],
}) {
  const Photo = PHOTO_COMPONENTS[type] || CardPhoto;
  const className = `actions-overlay${grayscale ? ' photo-grayscale' : ''}`;

  return (
    <div className={className}>
      <Photo url={url} alt={alt} />
      {renderUploadButton(canEdit, onClick, secondaryButtons.length > 0)}
      {renderSecondaryButtons(secondaryButtons)}
    </div>
  );
}
