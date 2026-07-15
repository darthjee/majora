import React from 'react';
import FieldErrors from '../../../../common/FieldErrors.jsx';
import FormField from '../../../../common/FormField.jsx';
import TextareaField from '../../../../common/TextareaField.jsx';
import ErrorAlert from '../../../../common/ErrorAlert.jsx';
import SubmitButton from '../../../../common/SubmitButton.jsx';
import Translator from '../../../../../i18n/Translator.js';
import Icons from '../../../../../utils/ui/Icons.js';

const POLL_TYPES = ['single', 'multiple'];

/**
 * Rendering helper for the game poll creation page.
 */
export default class GamePollNewHelper {
  /**
   * Render the poll creation form: title, description, type radios, and a
   * dynamically-growing options list.
   *
   * @param {{title: string, description: string, type: string, options: string[],
   *   status: string, fieldErrors: object}} formState - Form state.
   * @param {{onSubmit: Function, onTitleChange: Function, onDescriptionChange: Function,
   *   onTypeChange: Function, onOptionChange: Function, onOptionRemove: Function}} handlers -
   *   Event handlers.
   * @returns {React.ReactElement} Rendered new poll page.
   */
  static render(formState, handlers) {
    return (
      <div className="container mt-4">
        <h1>{Translator.t('game_poll_new_page.title')}</h1>
        {GamePollNewHelper.#renderError(formState)}
        <form onSubmit={handlers.onSubmit}>
          <FormField
            id="game-poll-new-title"
            type="text"
            label={Translator.t('game_poll_new_page.title_label')}
            value={formState.title}
            onChange={handlers.onTitleChange}
            errors={formState.fieldErrors.title ?? []}
          />
          <TextareaField
            id="game-poll-new-description"
            label={Translator.t('game_poll_new_page.description_label')}
            value={formState.description}
            onChange={handlers.onDescriptionChange}
            errors={formState.fieldErrors.description ?? []}
          />
          {GamePollNewHelper.#renderTypeField(formState, handlers)}
          {GamePollNewHelper.#renderOptions(formState, handlers)}
          <SubmitButton disabled={formState.status === 'submitting'}>
            {Translator.t('game_poll_new_page.submit')}
          </SubmitButton>
        </form>
      </div>
    );
  }

  static #renderError(formState) {
    if (formState.status !== 'error') {
      return null;
    }

    return <ErrorAlert error={Translator.t('game_poll_new_page.error')} />;
  }

  static #renderTypeField(formState, handlers) {
    return (
      <div className="mb-3">
        <span className="form-label d-block">{Translator.t('game_poll_new_page.type_label')}</span>
        {POLL_TYPES.map((type) => (
          <div className="form-check form-check-inline" key={type}>
            <input
              id={`game-poll-new-type-${type}`}
              type="radio"
              className="form-check-input"
              name="game-poll-new-type"
              value={type}
              checked={formState.type === type}
              onChange={() => handlers.onTypeChange(type)}
            />
            <label className="form-check-label" htmlFor={`game-poll-new-type-${type}`}>
              {Translator.t(`game_poll_new_page.type_${type}`)}
            </label>
          </div>
        ))}
        <FieldErrors errors={formState.fieldErrors.type ?? []} />
      </div>
    );
  }

  static #renderOptions(formState, handlers) {
    return (
      <div className="mb-3">
        <span className="form-label d-block">{Translator.t('game_poll_new_page.options_label')}</span>
        {formState.options.map((option, index) => (
          GamePollNewHelper.#renderOption(option, index, formState, handlers)
        ))}
        <FieldErrors errors={formState.fieldErrors.options ?? []} />
      </div>
    );
  }

  static #renderOption(option, index, formState, handlers) {
    const isLast = index === formState.options.length - 1;
    const isBlank = option.trim() === '';

    return (
      <div className="input-group mb-2" key={index}>
        <input
          id={`game-poll-new-option-${index}`}
          data-testid={`game-poll-new-option-${index}`}
          type="text"
          className="form-control"
          value={option}
          onChange={(event) => handlers.onOptionChange(index, event.target.value)}
        />
        {!(isLast && isBlank) && (
          <button
            type="button"
            className="btn btn-outline-danger"
            data-testid={`game-poll-new-option-remove-${index}`}
            onClick={() => handlers.onOptionRemove(index)}
          >
            <i className={`bi ${Icons.trash}`} aria-hidden="true"></i>
          </button>
        )}
      </div>
    );
  }
}
