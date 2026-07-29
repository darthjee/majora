import React from 'react';
import DocumentFileCard from '../../../../../../common/cards/DocumentFileCard.jsx';
import Translator from '../../../../../../../i18n/Translator.js';

/**
 * Rendering helper for the CharacterDocumentFilesPreview element.
 *
 * @description Unlike `DocumentFilesPreviewHelper` (the unrelated `GameDocument` page's own file
 *   shortlist), this never renders a "See all" card: no full-list page exists yet for a PC/NPC
 *   `CharacterDocument`'s files (issue #897 only asks for a shortlist), so there is nowhere for
 *   such a card to link to.
 */
export default class CharacterDocumentFilesPreviewHelper {
  /**
   * Render a preview section with a heading and a card grid of the underlying `GameDocument`'s
   * files. Each file card downloads the file on click (see `DocumentFileCard`).
   *
   * @param {object[]} files - List of file objects (`id`, `name`, `path`, `photo_path`,
   *   `character_document_id`).
   * @param {string} title - Section heading.
   * @returns {React.ReactElement} Character document files preview section element.
   */
  static render(files, title) {
    return (
      <div className="mt-4">
        <h2>{title}</h2>
        {CharacterDocumentFilesPreviewHelper.#renderBody(files)}
      </div>
    );
  }

  static #renderBody(files) {
    if (files.length === 0) {
      return <p className="text-muted">{Translator.t('character_document_files_preview.empty')}</p>;
    }

    return (
      <div className="row">
        {files.map((file) => <DocumentFileCard key={file.id} file={file} />)}
      </div>
    );
  }
}
