import React from 'react';
import FormField from '../../../../common/forms/FormField.jsx';
import TextareaField from '../../../../common/forms/TextareaField.jsx';
import ErrorAlert from '../../../../common/misc/ErrorAlert.jsx';
import SubmitButton from '../../../../common/buttons/SubmitButton.jsx';
import Translator from '../../../../../i18n/Translator.js';

/**
 * Rendering helper for the game session creation page.
 */
export default class GameSessionNewHelper {
  /**
   * Render the session creation form.
   *
   * @param {{title: string, date: string, description: string, status: string, fieldErrors:
   *   object}} formState - Form state.
   * @param {{onSubmit: Function, onTitleChange: Function, onDateChange: Function,
   *   onDescriptionChange: Function}} handlers - Event handlers.
   * @returns {React.ReactElement} Rendered new session page.
   */
  static render(formState, handlers) {
    return (
      <div className="container mt-4">
        <h1>{Translator.t('game_session_new_page.title')}</h1>
        {GameSessionNewHelper.#renderError(formState)}
        <form onSubmit={handlers.onSubmit}>
          <FormField
            id="game-session-new-title"
            type="text"
            label={Translator.t('game_session_new_page.title_label')}
            value={formState.title}
            onChange={handlers.onTitleChange}
            errors={formState.fieldErrors.title ?? []}
          />
          <FormField
            id="game-session-new-date"
            type="date"
            label={Translator.t('game_session_new_page.date_label')}
            value={formState.date}
            onChange={handlers.onDateChange}
            errors={formState.fieldErrors.date ?? []}
          />
          <TextareaField
            id="game-session-new-description"
            label={Translator.t('game_session_new_page.description_label')}
            value={formState.description}
            onChange={handlers.onDescriptionChange}
            errors={formState.fieldErrors.description ?? []}
          />
          <SubmitButton disabled={formState.status === 'submitting'}>
            {Translator.t('game_session_new_page.submit')}
          </SubmitButton>
        </form>
      </div>
    );
  }

  static #renderError(formState) {
    if (formState.status !== 'error') {
      return null;
    }

    return <ErrorAlert error={Translator.t('game_session_new_page.error')} />;
  }
}
