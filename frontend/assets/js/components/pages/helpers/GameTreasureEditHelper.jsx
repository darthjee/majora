import React from 'react';
import FormField from '../../elements/FormField.jsx';
import ErrorAlert from '../../elements/ErrorAlert.jsx';
import SubmitButton from '../../elements/SubmitButton.jsx';
import Translator from '../../../i18n/Translator.js';
import GameTreasuresHelper from './GameTreasuresHelper.jsx';

/**
 * Rendering helper for the game treasure edit page.
 */
export default class GameTreasureEditHelper {
  /**
   * Render the game treasure edit form.
   *
   * @param {{name: string, value: string, status: string, fieldErrors: object}} formState - Form state.
   * @param {{onSubmit: Function, onNameChange: Function, onValueChange: Function}} handlers - Event handlers.
   * @returns {React.ReactElement} Rendered edit page.
   */
  static render(formState, handlers) {
    return (
      <div className="container mt-4">
        <h1>{Translator.t('game_treasure_edit_page.title')}</h1>
        {GameTreasureEditHelper.#renderError(formState)}
        <form onSubmit={handlers.onSubmit}>
          <FormField
            id="game-treasure-edit-name"
            type="text"
            label={Translator.t('game_treasure_edit_page.name_label')}
            value={formState.name}
            onChange={handlers.onNameChange}
            errors={formState.fieldErrors.name ?? []}
          />
          <FormField
            id="game-treasure-edit-value"
            type="number"
            label={Translator.t('game_treasure_edit_page.value_label')}
            value={formState.value}
            onChange={handlers.onValueChange}
            errors={formState.fieldErrors.value ?? []}
          />
          <SubmitButton disabled={formState.status === 'submitting'}>
            {Translator.t('game_treasure_edit_page.submit')}
          </SubmitButton>
        </form>
      </div>
    );
  }

  /**
   * Render the loading state.
   *
   * @returns {React.ReactElement} Loading message.
   */
  static renderLoading() {
    return GameTreasuresHelper.renderLoading();
  }

  /**
   * Render the error state.
   *
   * @param {string} error - Error message.
   * @returns {React.ReactElement} Error alert.
   */
  static renderError(error) {
    return GameTreasuresHelper.renderError(error);
  }

  static #renderError(formState) {
    if (formState.status !== 'error') {
      return null;
    }

    return <ErrorAlert error={Translator.t('game_treasure_edit_page.error')} />;
  }
}
