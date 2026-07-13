import React from 'react';
import CardPhoto from '../../../../../common/CardPhoto.jsx';
import { MAX_PREVIEW_PHOTOS } from '../../../../../common/characterPreviewConstants.js';
import Translator from '../../../../../../i18n/Translator.js';

/**
 * Rendering helper for the CharacterPhotosPreview element.
 */
export default class CharacterPhotosPreviewHelper {
  /**
   * Render a preview section with a heading, a static card grid of the
   * first few photos (no click behavior, unlike the full gallery), and a
   * "See all" link.
   *
   * @param {object[]} photos - List of photo objects (`id`, `path`).
   * @param {string} title - Section heading.
   * @param {string} seeAllHref - Hash href for the "See all" link.
   * @returns {React.ReactElement} Character photos preview section element.
   */
  static render(photos, title, seeAllHref) {
    const preview = photos.slice(0, MAX_PREVIEW_PHOTOS);

    return (
      <div className="mt-4">
        <h2>{title}</h2>
        {CharacterPhotosPreviewHelper.#renderBody(preview)}
        <a href={seeAllHref}>{Translator.t('character_preview_section.see_all').replace('{{title}}', title)}</a>
      </div>
    );
  }

  static #renderBody(preview) {
    if (preview.length === 0) {
      return <p className="text-muted">{Translator.t('character_photos_preview.empty')}</p>;
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
      </div>
    );
  }
}
