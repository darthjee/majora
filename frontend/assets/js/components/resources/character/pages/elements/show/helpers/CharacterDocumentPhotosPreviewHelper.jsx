import React from 'react';
import PhotoCard from '../../../../../../common/cards/PhotoCard.jsx';
import Translator from '../../../../../../../i18n/Translator.js';

/**
 * Rendering helper for the CharacterDocumentPhotosPreview element.
 *
 * @description Unlike `DocumentPhotosPreviewHelper` (the unrelated `GameDocument` page's own
 *   photo shortlist), this never renders a "See all" card: no full-list page exists yet for a
 *   PC/NPC `CharacterDocument`'s photos (issue #897 only asks for a shortlist), so there is
 *   nowhere for such a card to link to.
 */
export default class CharacterDocumentPhotosPreviewHelper {
  /**
   * Render a preview section with a heading and a card grid of the underlying `GameDocument`'s
   * photos. Each photo card opens `PhotoViewModal` (via `onSelectPhoto`) instead of navigating
   * anywhere.
   *
   * @param {object[]} photos - List of photo objects (`id`, `path`, `character_document_id`).
   * @param {string} title - Section heading.
   * @param {Function} onSelectPhoto - Handler invoked with the photo when a preview card is
   *   clicked.
   * @returns {React.ReactElement} Character document photos preview section element.
   */
  static render(photos, title, onSelectPhoto) {
    return (
      <div className="mt-4">
        <h2>{title}</h2>
        {CharacterDocumentPhotosPreviewHelper.#renderBody(photos, onSelectPhoto)}
      </div>
    );
  }

  static #renderBody(photos, onSelectPhoto) {
    if (photos.length === 0) {
      return <p className="text-muted">{Translator.t('character_document_photos_preview.empty')}</p>;
    }

    return (
      <div className="row">
        {photos.map((photo) => (
          <PhotoCard key={photo.id} photo={photo} alt="" onClick={onSelectPhoto} />
        ))}
      </div>
    );
  }
}
