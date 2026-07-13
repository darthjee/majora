import React from 'react';
import BackButton from '../../../../elements/BackButton.jsx';
import ErrorAlert from '../../../../elements/ErrorAlert.jsx';
import LoadingMessage from '../../../../elements/LoadingMessage.jsx';
import Translator from '../../../../../i18n/Translator.js';
import TreasureMoney from '../../../../elements/TreasureMoney.jsx';

/**
 * Rendering helper for the Treasure detail page.
 */
export default class TreasureHelper {
  /**
   * Render the treasure detail view.
   *
   * @param {object} treasure - Treasure data object.
   * @param {number} treasure.id - Treasure id.
   * @param {string} treasure.name - Treasure name.
   * @param {number} treasure.value - Treasure value.
   * @param {boolean} [treasure.can_edit] - Whether the current user can edit this treasure.
   * @returns {React.ReactElement} Treasure detail element.
   */
  static render(treasure) {
    return (
      <div className="container mt-4">
        <BackButton href="#/treasures" />
        <h1>
          {treasure.name}
          {TreasureHelper.#renderEditLink(treasure)}
        </h1>
        <p className="mt-3">
          <strong>Value:</strong>
          {' '}
          <TreasureMoney value={treasure.value} />
        </p>
      </div>
    );
  }

  /**
   * Render the loading state.
   *
   * @returns {React.ReactElement} Loading message.
   */
  static renderLoading() {
    return <LoadingMessage message={Translator.t('treasure_page.loading')} />;
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

  static #renderEditLink(treasure) {
    if (!treasure.can_edit) {
      return null;
    }

    return (
      <a href={`#/treasures/${treasure.id}/edit`} className="btn btn-secondary ms-2">
        {Translator.t('treasure_page.edit')}
      </a>
    );
  }
}
