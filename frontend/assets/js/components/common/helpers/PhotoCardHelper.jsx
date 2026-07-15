import React from 'react';
import CardPhoto from '../CardPhoto.jsx';
import ActionBar from '../ActionBar.jsx';
import Translator from '../../../i18n/Translator.js';
import Icons from '../../../utils/ui/Icons.js';
import Noop from '../../../utils/Noop.js';

/**
 * Rendering helper for the PhotoCard element.
 */
export default class PhotoCardHelper {
  /**
   * Render a Bootstrap card for a photo that opens a lightbox on click
   * instead of navigating to another page.
   *
   * @description Wraps the existing clickable card in a hover-reveal
   *   `.actions-overlay` alongside a sibling "mark as profile" action bar
   *   button, so the icon click never bubbles into the card's own
   *   "open lightbox" click handler.
   * @param {object} photo - Photo data object.
   * @param {number} photo.id - Photo ID.
   * @param {string} photo.path - Photo storage path, used as the image src.
   * @param {string} alt - Alt text applied to the photo image.
   * @param {Function} onClick - Handler invoked with the photo when the card is clicked.
   * @param {boolean} [canSetProfilePhoto] - Whether the current user may mark this photo
   *   as the character's profile photo.
   * @param {boolean} [isProfilePhoto] - Whether this photo is already the character's
   *   profile photo.
   * @param {Function} [onSetProfilePhoto] - Handler invoked with the photo id when the
   *   "mark as profile" action bar button is clicked.
   * @returns {React.ReactElement} Photo card element.
   */
  static render(photo, alt, onClick, canSetProfilePhoto = false, isProfilePhoto = false, onSetProfilePhoto = Noop.noop) {
    const cardClassName = isProfilePhoto ? 'card h-100 border border-success' : 'card h-100';

    return (
      <div className="col-6 col-sm-4 col-md-3 col-lg-2 mb-4">
        <div className="actions-overlay">
          <button
            type="button"
            className="btn p-0 border-0 bg-transparent text-decoration-none text-dark w-100"
            onClick={() => onClick(photo)}
          >
            <div className={cardClassName}>
              <CardPhoto url={photo.path} alt={alt} />
            </div>
          </button>
          <ActionBar
            canEdit={false}
            onClick={Noop.noop}
            secondaryButtons={PhotoCardHelper.#buildSecondaryButtons(
              photo, canSetProfilePhoto, isProfilePhoto, onSetProfilePhoto,
            )}
          />
        </div>
      </div>
    );
  }

  /**
   * Build the "mark as profile" secondary button definition, shown only when the
   * current user may set the profile photo and this photo is not already it.
   *
   * @param {object} photo - Photo data object.
   * @param {number} photo.id - Photo ID.
   * @param {boolean} canSetProfilePhoto - Whether the current user may mark this photo
   *   as the character's profile photo.
   * @param {boolean} isProfilePhoto - Whether this photo is already the character's
   *   profile photo.
   * @param {Function} onSetProfilePhoto - Handler invoked with the photo id on click.
   * @returns {{label: string, variant: string, icon: string, onClick: Function}[]} Secondary
   *   button definitions, empty when the action should not be shown.
   */
  static #buildSecondaryButtons(photo, canSetProfilePhoto, isProfilePhoto, onSetProfilePhoto) {
    if (!canSetProfilePhoto || isProfilePhoto) {
      return [];
    }

    return [{
      label: Translator.t('photo_view_modal.set_profile_photo'),
      variant: 'primary',
      icon: Icons.postage,
      onClick: () => onSetProfilePhoto(photo.id),
    }];
  }
}
