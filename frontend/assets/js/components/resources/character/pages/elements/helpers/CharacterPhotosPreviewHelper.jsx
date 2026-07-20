import React from 'react';
import CardPhoto from '../../../../../common/cards/CardPhoto.jsx';
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
   * `onSelectPhoto` is provided.
   *
   * @param {object[]} photos - List of photo objects (`id`, `path`).
   * @param {string} title - Section heading.
   * @param {string} seeAllHref - Hash href for the "See all" card.
   * @param {Function} [onSelectPhoto] - Handler invoked with the photo when a preview
   *   card is clicked. When omitted, the cards render as plain (non-interactive) markup.
   * @returns {React.ReactElement} Character photos preview section element.
   */
  static render(photos, title, seeAllHref, onSelectPhoto) {
    const preview = photos.slice(0, MAX_PREVIEW_PHOTOS);

    return (
      <div className="mt-4">
        <h2>{title}</h2>
        {CharacterPhotosPreviewHelper.#renderBody(preview, title, seeAllHref, onSelectPhoto)}
      </div>
    );
  }

  static #renderBody(preview, title, seeAllHref, onSelectPhoto) {
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
        {preview.map((photo) => (
          <div key={photo.id} className="col-6 col-sm-4 col-md-3 col-lg-2 mb-4">
            {CharacterPhotosPreviewHelper.#renderCard(photo, onSelectPhoto)}
          </div>
        ))}
        <SeeAllCard icon={Icons.camera} text={seeAllText} href={seeAllHref} />
      </div>
    );
  }

  static #renderCard(photo, onSelectPhoto) {
    const card = (
      <div className="card h-100">
        <CardPhoto url={photo.path} alt="" />
      </div>
    );

    if (!onSelectPhoto) return card;

    return (
      <button
        type="button"
        className="btn p-0 border-0 bg-transparent text-decoration-none text-dark w-100 h-100"
        onClick={() => onSelectPhoto(photo)}
      >
        {card}
      </button>
    );
  }
}
