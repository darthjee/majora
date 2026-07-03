import React from 'react';
import CardPhoto from './CardPhoto.jsx';
import CardAvatar from './CardAvatar.jsx';
import Translator from '../../i18n/Translator.js';

/**
 * Wraps a photo/avatar with a hover-reveal upload button overlaid on top of it.
 *
 * @description Renders the underlying photo/avatar unconditionally, but only
 *   renders the upload button when `canEdit` is true — for users without edit
 *   access the button is omitted entirely, not just disabled.
 * @param {object} props - Component props.
 * @param {'photo'|'avatar'} [props.type] - Which underlying image component to
 *   render: `'avatar'` uses {@link CardAvatar}, anything else (default) uses
 *   {@link CardPhoto}.
 * @param {string|null} [props.url] - Image URL, or null/undefined to use the default photo.
 * @param {string} props.alt - Alt text for the image.
 * @param {boolean} [props.canEdit] - Whether the current user may upload a new photo.
 * @param {Function} props.onClick - Handler invoked when the upload button is clicked.
 * @returns {React.ReactElement} Rendered photo/avatar with an optional upload overlay button.
 */
export default function PhotoUploadOverlay({ type, url, alt, canEdit, onClick }) {
  const Photo = type === 'avatar' ? CardAvatar : CardPhoto;

  return (
    <div className="photo-upload-overlay">
      <Photo url={url} alt={alt} />
      {canEdit && (
        <button
          type="button"
          className="btn btn-secondary photo-upload-overlay-button"
          onClick={onClick}
        >
          {Translator.t('photo_upload_modal.title')}
        </button>
      )}
    </div>
  );
}
