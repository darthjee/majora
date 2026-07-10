import React from 'react';
import FormField from '../../elements/FormField.jsx';
import ErrorAlert from '../../elements/ErrorAlert.jsx';
import SubmitButton from '../../elements/SubmitButton.jsx';
import ActionsOverlay from '../../elements/ActionsOverlay.jsx';
import Translator from '../../../i18n/Translator.js';
import GameHelper from './GameHelper.jsx';

/**
 * Rendering helper for the game edit page.
 */
export default class GameEditHelper {
  /**
   * Render the game edit form.
   *
   * @param {{name: string, description: string, cover_photo_path: string|null,
   *   status: string, fieldErrors: object}} formState - Form state.
   * @param {{onSubmit: Function, onNameChange: Function,
   *   onDescriptionChange: Function,
   *   onOpenUploadModal: Function}} handlers - Event handlers.
   * @returns {React.ReactElement} Rendered edit page.
   */
  static render(formState, handlers) {
    return (
      <div className="container mt-4">
        <h1>{Translator.t('game_edit_page.title')}</h1>
        {GameEditHelper.#renderError(formState)}
        <div className="row">
          <div className="col-md-4">
            <ActionsOverlay
              url={formState.cover_photo_path}
              alt={formState.name}
              canEdit
              onClick={handlers.onOpenUploadModal}
            />
          </div>
          <div className="col-md-8">
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
                id="game-edit-description"
                type="text"
                label={Translator.t('game_edit_page.description_label')}
                value={formState.description}
                onChange={handlers.onDescriptionChange}
                errors={formState.fieldErrors.description ?? []}
              />
              <SubmitButton disabled={formState.status === 'submitting'}>
                {Translator.t('game_edit_page.submit')}
              </SubmitButton>
            </form>
          </div>
        </div>
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
