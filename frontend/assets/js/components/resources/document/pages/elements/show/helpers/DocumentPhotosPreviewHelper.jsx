import React from 'react';
import PhotoCard from '../../../../../../common/cards/PhotoCard.jsx';
import SeeAllCard from '../../../../../../common/cards/SeeAllCard.jsx';
import Translator from '../../../../../../../i18n/Translator.js';
import Icons from '../../../../../../../utils/ui/Icons.js';

/**
 * Rendering helper for the DocumentPhotosPreview element.
 */
export default class DocumentPhotosPreviewHelper {
  /**
   * Render a preview section with a heading and a card grid of the document's photos, ending
   * with a "See all" card. Each photo card opens `PhotoViewModal` (via `onSelectPhoto`) instead
   * of navigating anywhere.
   *
   * @param {object[]} photos - List of photo objects (`id`, `path`).
   * @param {string} title - Section heading.
   * @param {string} seeAllHref - Hash href for the "See all" card.
   * @param {Function} onSelectPhoto - Handler invoked with the photo when a preview card is
   *   clicked.
   * @returns {React.ReactElement} Document photos preview section element.
   */
  static render(photos, title, seeAllHref, onSelectPhoto) {
    return (
      <div className="mt-4">
        <h2>{title}</h2>
        {DocumentPhotosPreviewHelper.#renderBody(photos, title, seeAllHref, onSelectPhoto)}
      </div>
    );
  }

  static #renderBody(photos, title, seeAllHref, onSelectPhoto) {
    const seeAllText = Translator.t('character_preview_section.see_all').replace('{{title}}', title);

    if (photos.length === 0) {
      return (
        <>
          <p className="text-muted">{Translator.t('game_document_photos_preview.empty')}</p>
          <div className="row">
            <SeeAllCard icon={Icons.camera} text={seeAllText} href={seeAllHref} />
          </div>
        </>
      );
    }

    return (
      <div className="row">
        {photos.map((photo) => (
          <PhotoCard key={photo.id} photo={photo} alt="" onClick={onSelectPhoto} />
        ))}
        <SeeAllCard icon={Icons.camera} text={seeAllText} href={seeAllHref} />
      </div>
    );
  }
}
