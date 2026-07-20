import React from 'react';
import FormField from '../../../../common/forms/FormField.jsx';
import ErrorAlert from '../../../../common/misc/ErrorAlert.jsx';
import SubmitButton from '../../../../common/buttons/SubmitButton.jsx';
import CharacterDescriptionField from '../elements/CharacterDescriptionField.jsx';
import Translator from '../../../../../i18n/Translator.js';

/**
 * Rendering helper for the PC/NPC item creation page (issue #714). Shared by both kinds, since
 * the form itself (`name`/`description`/`hidden`) has no PC/NPC-specific fields.
 */
export default class CharacterItemNewHelper {
  /**
   * Render the item creation form: `name` (plain text field), `description` (the existing
   * generic `CharacterDescriptionField`), and `hidden` (the same raw `form-check form-switch`
   * checkbox markup `GameNpcNewHelper` already uses) — no avatar/links/money fields, since this
   * form is just the three fields from the issue.
   *
   * @param {{name: string, description: string, hidden: boolean, status: string,
   *   fieldErrors: object}} formState - Form state.
   * @param {{onSubmit: Function, onNameChange: Function, onDescriptionChange: Function,
   *   onHiddenChange: Function}} handlers - Event handlers.
   * @returns {React.ReactElement} Rendered new item page.
   */
  static render(formState, handlers) {
    return (
      <div className="container mt-4">
        <h1>{Translator.t('character_item_new_page.title')}</h1>
        {CharacterItemNewHelper.#renderError(formState)}
        <form onSubmit={handlers.onSubmit}>
          <FormField
            id="character-item-new-name"
            type="text"
            label={Translator.t('character_item_new_page.name_label')}
            value={formState.name}
            onChange={handlers.onNameChange}
            errors={formState.fieldErrors.name ?? []}
          />
          <CharacterDescriptionField
            id="character-item-new-description"
            label={Translator.t('character_item_new_page.description_label')}
            value={formState.description}
            onChange={handlers.onDescriptionChange}
            errors={formState.fieldErrors.description ?? []}
          />
          {CharacterItemNewHelper.#renderHiddenSwitch(formState, handlers)}
          <SubmitButton disabled={formState.status === 'submitting'}>
            {Translator.t('character_item_new_page.submit')}
          </SubmitButton>
        </form>
      </div>
    );
  }

  static #renderError(formState) {
    if (formState.status !== 'error') {
      return null;
    }

    return <ErrorAlert error={Translator.t('character_item_new_page.error')} />;
  }

  static #renderHiddenSwitch(formState, handlers) {
    return (
      <div className="form-check form-switch mb-3">
        <input
          id="character-item-new-hidden"
          type="checkbox"
          role="switch"
          className="form-check-input"
          checked={formState.hidden}
          onChange={handlers.onHiddenChange}
        />
        <label htmlFor="character-item-new-hidden" className="form-check-label">
          {Translator.t('character_item_new_page.hidden_label')}
        </label>
      </div>
    );
  }
}
