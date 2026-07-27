import React from 'react';
import DocumentFileCard from '../../../../../../common/cards/DocumentFileCard.jsx';
import SeeAllCard from '../../../../../../common/cards/SeeAllCard.jsx';
import Translator from '../../../../../../../i18n/Translator.js';
import Icons from '../../../../../../../utils/ui/Icons.js';

/**
 * Rendering helper for the DocumentFilesPreview element.
 */
export default class DocumentFilesPreviewHelper {
  /**
   * Render a preview section with a heading and a card grid of the document's files, ending
   * with a "See all" card. Each file card downloads the file on click (see `DocumentFileCard`).
   *
   * @param {object[]} files - List of `GameDocumentFile` objects (`id`, `name`, `path`,
   *   `photo_path`).
   * @param {string} title - Section heading.
   * @param {string} seeAllHref - Hash href for the "See all" card.
   * @returns {React.ReactElement} Document files preview section element.
   */
  static render(files, title, seeAllHref) {
    return (
      <div className="mt-4">
        <h2>{title}</h2>
        {DocumentFilesPreviewHelper.#renderBody(files, title, seeAllHref)}
      </div>
    );
  }

  static #renderBody(files, title, seeAllHref) {
    const seeAllText = Translator.t('character_preview_section.see_all').replace('{{title}}', title);

    if (files.length === 0) {
      return (
        <>
          <p className="text-muted">{Translator.t('game_document_files_preview.empty')}</p>
          <div className="row">
            <SeeAllCard icon={Icons.files} text={seeAllText} href={seeAllHref} />
          </div>
        </>
      );
    }

    return (
      <div className="row">
        {files.map((file) => <DocumentFileCard key={file.id} file={file} />)}
        <SeeAllCard icon={Icons.files} text={seeAllText} href={seeAllHref} />
      </div>
    );
  }
}
