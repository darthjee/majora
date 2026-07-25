import React from 'react';
import PhotoCard from '../../../../../common/cards/PhotoCard.jsx';
import SeeAllCard from '../../../../../common/cards/SeeAllCard.jsx';
import { MAX_PREVIEW_PHOTOS } from '../../../../../common/cards/characterPreviewConstants.js';
import Translator from '../../../../../../i18n/Translator.js';
import Icons from '../../../../../../utils/ui/Icons.js';

/**
 * Rendering helper for the CharacterPhotosPreview element.
 */
export default class CharacterPhotosPreviewHelper {
  /**
   * Render a preview section with a heading and a card grid of the first few
   * photos, ending with a "See all" card. Each photo card is clickable when
   * `onSelectPhoto` is provided, and shows a "set as profile photo" hover
   * action when `canSetProfilePhoto` is true.
   *
   * @param {object[]} photos - List of photo objects (`id`, `path`).
   * @param {string} title - Section heading.
   * @param {string} seeAllHref - Hash href for the "See all" card.
   * @param {Function} [onSelectPhoto] - Handler invoked with the photo when a preview
   *   card is clicked. When omitted, the cards render as plain (non-interactive) markup.
   * @param {boolean} [canSetProfilePhoto] - Whether the current user may mark a preview
   *   photo as the character's profile photo, revealing the hover action bar button.
   * @param {number|null} [profilePhotoId] - Id of the character's current profile photo,
   *   or null/undefined when none is set.
   * @param {Function} [onSetProfilePhoto] - Handler invoked with the photo id when the
   *   "mark as profile" action bar button is clicked.
   * @returns {React.ReactElement} Character photos preview section element.
   */
  static render(photos, title, seeAllHref, onSelectPhoto, canSetProfilePhoto, profilePhotoId, onSetProfilePhoto) {
    const preview = photos.slice(0, MAX_PREVIEW_PHOTOS);

    return (
      <div className="mt-4">
        <h2>{title}</h2>
        {CharacterPhotosPreviewHelper.#renderBody(
          preview, title, seeAllHref, onSelectPhoto, canSetProfilePhoto, profilePhotoId, onSetProfilePhoto,
        )}
      </div>
    );
  }

  static #renderBody(preview, title, seeAllHref, onSelectPhoto, canSetProfilePhoto, profilePhotoId, onSetProfilePhoto) {
    const seeAllText = Translator.t('character_preview_section.see_all').replace('{{title}}', title);

    if (preview.length === 0) {
      return (
        <>
          <p className="text-muted">{Translator.t('character_photos_preview.empty')}</p>
          <div className="row">
            <SeeAllCard icon={Icons.camera} text={seeAllText} href={seeAllHref} />
          </div>
        </>
      );
    }

    return (
      <div className="row">
        {preview.map((photo) => CharacterPhotosPreviewHelper.#renderCard(
          photo, onSelectPhoto, canSetProfilePhoto, profilePhotoId, onSetProfilePhoto,
        ))}
        <SeeAllCard icon={Icons.camera} text={seeAllText} href={seeAllHref} />
      </div>
    );
  }

  static #renderCard(photo, onSelectPhoto, canSetProfilePhoto, profilePhotoId, onSetProfilePhoto) {
    return (
      <PhotoCard
        key={photo.id}
        photo={photo}
        alt=""
        onClick={onSelectPhoto}
        canSetProfilePhoto={canSetProfilePhoto}
        isProfilePhoto={photo.id === profilePhotoId}
        onSetProfilePhoto={onSetProfilePhoto}
      />
    );
  }
}
