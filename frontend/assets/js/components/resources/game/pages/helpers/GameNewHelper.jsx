import React from 'react';
import FormField from '../../../../elements/FormField.jsx';
import ErrorAlert from '../../../../elements/ErrorAlert.jsx';
import SubmitButton from '../../../../elements/SubmitButton.jsx';
import Translator from '../../../../../i18n/Translator.js';
import GameHelper from './GameHelper.jsx';

/**
 * Rendering helper for the game creation page.
 */
export default class GameNewHelper {
  /**
   * Render the game creation form.
   *
   * @param {{name: string, description: string,
   *   status: string, fieldErrors: object}} formState - Form state.
   * @param {{onSubmit: Function, onNameChange: Function,
   *   onDescriptionChange: Function}} handlers - Event handlers.
   * @returns {React.ReactElement} Rendered new game page.
   */
  static render(formState, handlers) {
    return (
      <div className="container mt-4">
        <h1>{Translator.t('game_new_page.title')}</h1>
        {GameNewHelper.#renderError(formState)}
        <form onSubmit={handlers.onSubmit}>
          <FormField
            id="game-new-name"
            type="text"
            label={Translator.t('game_new_page.name_label')}
            value={formState.name}
            onChange={handlers.onNameChange}
            errors={formState.fieldErrors.name ?? []}
          />
          <FormField
            id="game-new-description"
            type="text"
            label={Translator.t('game_new_page.description_label')}
            value={formState.description}
            onChange={handlers.onDescriptionChange}
            errors={formState.fieldErrors.description ?? []}
          />
          <SubmitButton disabled={formState.status === 'submitting'}>
            {Translator.t('game_new_page.submit')}
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
    return GameHelper.renderLoading();
  }

  static #renderError(formState) {
    if (formState.status !== 'error') {
      return null;
    }

    return <ErrorAlert error={Translator.t('game_new_page.error')} />;
  }
}
