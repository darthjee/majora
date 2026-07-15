import React from 'react';
import FormField from '../../../../common/FormField.jsx';
import TextareaField from '../../../../common/TextareaField.jsx';
import ErrorAlert from '../../../../common/ErrorAlert.jsx';
import SubmitButton from '../../../../common/SubmitButton.jsx';
import Translator from '../../../../../i18n/Translator.js';
import GameSessionHelper from './GameSessionHelper.jsx';

/**
 * Rendering helper for the game session edit page.
 */
export default class GameSessionEditHelper {
  /**
   * Render the session edit form.
   *
   * @param {{title: string, date: string, description: string, status: string, fieldErrors:
   *   object}} formState - Form state.
   * @param {{onSubmit: Function, onTitleChange: Function, onDateChange: Function,
   *   onDescriptionChange: Function}} handlers - Event handlers.
   * @returns {React.ReactElement} Rendered edit page.
   */
  static render(formState, handlers) {
    return (
      <div className="container mt-4">
        <h1>{Translator.t('game_session_edit_page.title')}</h1>
        {GameSessionEditHelper.#renderError(formState)}
        <form onSubmit={handlers.onSubmit}>
          <FormField
            id="game-session-edit-title"
            type="text"
            label={Translator.t('game_session_edit_page.title_label')}
            value={formState.title}
            onChange={handlers.onTitleChange}
            errors={formState.fieldErrors.title ?? []}
          />
          <FormField
            id="game-session-edit-date"
            type="date"
            label={Translator.t('game_session_edit_page.date_label')}
            value={formState.date}
            onChange={handlers.onDateChange}
            errors={formState.fieldErrors.date ?? []}
          />
          <TextareaField
            id="game-session-edit-description"
            label={Translator.t('game_session_edit_page.description_label')}
            value={formState.description}
            onChange={handlers.onDescriptionChange}
            errors={formState.fieldErrors.description ?? []}
          />
          <SubmitButton disabled={formState.status === 'submitting'}>
            {Translator.t('game_session_edit_page.submit')}
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
    return GameSessionHelper.renderLoading();
  }

  static #renderError(formState) {
    if (formState.status !== 'error') {
      return null;
    }

    return <ErrorAlert error={Translator.t('game_session_edit_page.error')} />;
  }
}
