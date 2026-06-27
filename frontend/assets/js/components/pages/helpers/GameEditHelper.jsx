import React from 'react';
import FormField from '../../elements/FormField.jsx';
import ErrorAlert from '../../elements/ErrorAlert.jsx';
import Translator from '../../../i18n/Translator.js';
import GameHelper from './GameHelper.jsx';

/**
 * Rendering helper for the game edit page.
 */
export default class GameEditHelper {
  /**
   * Render the game edit form.
   *
   * @param {{name: string, photo: string, description: string,
   *   status: string, fieldErrors: object}} formState - Form state.
   * @param {{onSubmit: Function, onNameChange: Function,
   *   onPhotoChange: Function, onDescriptionChange: Function}} handlers - Event handlers.
   * @returns {React.ReactElement} Rendered edit page.
   */
  static render(formState, handlers) {
    return (
      <div className="container mt-4">
        <h1>{Translator.t('game_edit_page.title')}</h1>
        {GameEditHelper.#renderError(formState)}
        <form onSubmit={handlers.onSubmit}>
          <FormField
            id="game-edit-name"
            type="text"
            label={Translator.t('game_edit_page.name_label')}
            value={formState.name}
            onChange={handlers.onNameChange}
            errors={formState.fieldErrors.name ?? []}
          />
          <FormField
            id="game-edit-photo"
            type="text"
            label={Translator.t('game_edit_page.photo_label')}
            value={formState.photo}
            onChange={handlers.onPhotoChange}
            errors={formState.fieldErrors.photo ?? []}
          />
          <FormField
            id="game-edit-description"
            type="text"
            label={Translator.t('game_edit_page.description_label')}
            value={formState.description}
            onChange={handlers.onDescriptionChange}
            errors={formState.fieldErrors.description ?? []}
          />
          <button
            className="btn btn-primary"
            type="submit"
            disabled={formState.status === 'submitting'}
          >
            {Translator.t('game_edit_page.submit')}
          </button>
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

    return <ErrorAlert error={Translator.t('game_edit_page.error')} />;
  }
}
