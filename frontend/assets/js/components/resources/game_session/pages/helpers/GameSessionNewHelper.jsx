import React from 'react';
import FormField from '../../../../common/FormField.jsx';
import ErrorAlert from '../../../../common/ErrorAlert.jsx';
import SubmitButton from '../../../../common/SubmitButton.jsx';
import Translator from '../../../../../i18n/Translator.js';

/**
 * Rendering helper for the game session creation page.
 */
export default class GameSessionNewHelper {
  /**
   * Render the session creation form.
   *
   * @param {{title: string, date: string, status: string, fieldErrors: object}} formState - Form state.
   * @param {{onSubmit: Function, onTitleChange: Function, onDateChange: Function}} handlers - Event handlers.
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
