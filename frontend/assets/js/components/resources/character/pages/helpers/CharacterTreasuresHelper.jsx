import React from 'react';
import ErrorAlert from '../../../../common/ErrorAlert.jsx';
import LoadingMessage from '../../../../common/LoadingMessage.jsx';
import PageActions from '../../../../common/PageActions.jsx';
import Pagination from '../../../../common/Pagination.jsx';
import TreasureCard from '../../../../common/TreasureCard.jsx';
import UploadButton from '../../../../common/UploadButton.jsx';
import Translator from '../../../../../i18n/Translator.js';
import Noop from '../../../../../utils/Noop.js';

/**
 * Rendering helper for the Character Treasures (PC and NPC) listing page.
 */
export default class CharacterTreasuresHelper {
  /**
   * Render the treasures card grid with pagination and a back button.
   *
   * @param {object[]} treasures - List of owned treasure objects (`id`, `treasure_id`,
   *   `name`, `quantity`, `value`, `photo_path`).
   * @param {object} pagination - Pagination metadata.
   * @param {number} pagination.page - Current page.
   * @param {number} pagination.pages - Total pages.
   * @param {number} pagination.perPage - Items per page.
   * @param {string} basePath - Base hash path used for pagination links.
   * @param {string} backHref - Hash path to the parent character page.
   * @param {boolean} [canEdit] - Whether the current user may acquire/sell treasures.
   * @param {Function} [onAddTreasure] - Handler invoked when the "Add treasure" button is clicked.
   * @returns {React.ReactElement} Treasures card grid with pagination.
   */
  static render(treasures, pagination, basePath, backHref, canEdit = false, onAddTreasure = Noop.noop) {
    return (
      <div className="container mt-4">
        <PageActions backHref={backHref}>
          {CharacterTreasuresHelper.#renderAddButton(canEdit, onAddTreasure)}
        </PageActions>
        <h1 className="mb-4">{Translator.t('character_treasures_page.title')}</h1>
        <div className="row">
          {treasures.map((treasure) => (
            <TreasureCard
              key={treasure.id}
              treasure={{
                id: treasure.treasure_id,
                name: treasure.name,
                value: treasure.value,
                photo_path: treasure.photo_path,
              }}
              quantity={treasure.quantity}
            />
          ))}
        </div>
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.pages}
          perPage={pagination.perPage}
          basePath={basePath}
        />
      </div>
    );
  }

  /**
   * Render the loading state.
   *
   * @returns {React.ReactElement} Loading message.
   */
  static renderLoading() {
    return <LoadingMessage message={Translator.t('character_treasures_page.loading')} />;
  }

  /**
   * Render the error state.
   *
   * @param {string} error - Error message.
   * @returns {React.ReactElement} Error alert.
   */
  static renderError(error) {
    return <ErrorAlert error={error} />;
  }

  static #renderAddButton(canEdit, onAddTreasure) {
    if (!canEdit) return null;

    return (
      <UploadButton onClick={onAddTreasure}>
        {Translator.t('character_treasures_page.add_treasure')}
      </UploadButton>
    );
  }
}
