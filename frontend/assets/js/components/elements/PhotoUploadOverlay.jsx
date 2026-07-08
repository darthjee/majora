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

/**
 * Render the primary upload button, using the centered modifier class when
 * no secondary button is present, or the left modifier class when it is.
 *
 * @param {boolean} canEdit - Whether the current user may upload a new photo.
 * @param {Function} onClick - Handler invoked when the upload button is clicked.
 * @param {boolean} hasSecondaryButton - Whether a secondary button will also be rendered.
 * @returns {React.ReactElement|null} Upload button element, or null when canEdit is false.
 */
function renderUploadButton(canEdit, onClick, hasSecondaryButton) {
  if (!canEdit) {
    return null;
  }

  const modifierClass = hasSecondaryButton
    ? 'photo-upload-overlay-button-left'
    : 'photo-upload-overlay-button';
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
 * Render the optional secondary overlay button (e.g. Slain/Revive).
 *
 * @param {{label: string, variant: string, icon: string, onClick: Function}} [secondaryButton] - Secondary button definition.
 * @returns {React.ReactElement|null} Secondary button element, or null when absent.
 */
function renderSecondaryButton(secondaryButton) {
  if (!secondaryButton) {
    return null;
  }

  return (
    <button
      type="button"
      className={`btn btn-${secondaryButton.variant} photo-upload-overlay-button-right`}
      onClick={secondaryButton.onClick}
      aria-label={secondaryButton.label}
      title={secondaryButton.label}
    >
      <i className={`bi ${secondaryButton.icon}`} aria-hidden="true"></i>
    </button>
  );
}

/**
 * Wraps a photo/avatar with a hover-reveal upload button overlaid on top of it.
 *
 * @description Renders the underlying photo/avatar unconditionally, but only
 *   renders the upload button when `canEdit` is true — for users without edit
 *   access the button is omitted entirely, not just disabled. Optionally
 *   renders the photo in grayscale and/or a second overlay button.
 * @param {object} props - Component props.
 * @param {'photo'|'avatar'|'treasure'} [props.type] - Which underlying image component to
 *   render: `'avatar'` uses {@link CardAvatar}, `'treasure'` uses
 *   {@link CardTreasureImage}, anything else (default) uses {@link CardPhoto}.
 * @param {string|null} [props.url] - Image URL, or null/undefined to use the default photo.
 * @param {string} props.alt - Alt text for the image.
 * @param {boolean} [props.canEdit] - Whether the current user may upload a new photo.
 * @param {Function} props.onClick - Handler invoked when the upload button is clicked.
 * @param {boolean} [props.grayscale] - Whether to render the photo in grayscale.
 * @param {{label: string, variant: string, icon: string, onClick: Function}} [props.secondaryButton] - Optional
 *   second overlay button (e.g. Slain/Revive), rendered on the right when the primary
 *   upload button is present on the left.
 * @returns {React.ReactElement} Rendered photo/avatar with optional upload/secondary overlay buttons.
 */
export default function PhotoUploadOverlay({
  type, url, alt, canEdit, onClick, grayscale = false, secondaryButton,
}) {
  const Photo = PHOTO_COMPONENTS[type] || CardPhoto;
  const className = `photo-upload-overlay${grayscale ? ' photo-grayscale' : ''}`;

  return (
    <div className={className}>
      <Photo url={url} alt={alt} />
      {renderUploadButton(canEdit, onClick, Boolean(secondaryButton))}
      {renderSecondaryButton(secondaryButton)}
    </div>
  );
}
