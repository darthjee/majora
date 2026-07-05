import React from 'react';
import ErrorAlert from '../../elements/ErrorAlert.jsx';
import LoadingMessage from '../../elements/LoadingMessage.jsx';
import PageActions from '../../elements/PageActions.jsx';
import Pagination from '../../elements/Pagination.jsx';
import Table from '../../elements/Table.jsx';
import Translator from '../../../i18n/Translator.js';

/**
 * Rendering helper for the Character Treasures (PC and NPC) listing page.
 */
export default class CharacterTreasuresHelper {
  /**
   * Render the treasures table with pagination and a back button.
   *
   * @param {object[]} treasures - List of treasure objects (`id`, `name`, `quantity`, `value`).
   * @param {object} pagination - Pagination metadata.
   * @param {number} pagination.page - Current page.
   * @param {number} pagination.pages - Total pages.
   * @param {number} pagination.perPage - Items per page.
   * @param {string} basePath - Base hash path used for pagination links.
   * @param {string} backHref - Hash path to the parent character page.
   * @returns {React.ReactElement} Treasures table with pagination.
   */
  static render(treasures, pagination, basePath, backHref) {
    const columns = [
      { key: 'name', label: Translator.t('character_treasures_page.name_column') },
      { key: 'quantity', label: Translator.t('character_treasures_page.quantity_column') },
      { key: 'value', label: Translator.t('character_treasures_page.value_column') },
    ];

    return (
      <div className="container mt-4">
        <PageActions backHref={backHref} />
        <h1 className="mb-4">{Translator.t('character_treasures_page.title')}</h1>
        <Table columns={columns} rows={treasures} />
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
}
