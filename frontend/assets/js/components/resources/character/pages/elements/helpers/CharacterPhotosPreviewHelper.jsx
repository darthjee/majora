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
   * Render a preview section with a heading and a static card grid of the
   * first few photos (no click behavior, unlike the full gallery), ending
   * with a "See all" card.
   *
   * @param {object[]} photos - List of photo objects (`id`, `path`).
   * @param {string} title - Section heading.
   * @param {string} seeAllHref - Hash href for the "See all" card.
   * @returns {React.ReactElement} Character photos preview section element.
   */
  static render(photos, title, seeAllHref) {
    const preview = photos.slice(0, MAX_PREVIEW_PHOTOS);

    return (
      <div className="mt-4">
        <h2>{title}</h2>
        {CharacterPhotosPreviewHelper.#renderBody(preview, title, seeAllHref)}
      </div>
    );
  }

  static #renderBody(preview, title, seeAllHref) {
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
            <div className="card h-100">
              <CardPhoto url={photo.path} alt="" />
            </div>
          </div>
        ))}
        <SeeAllCard icon={Icons.camera} text={seeAllText} href={seeAllHref} />
      </div>
    );
  }
}
