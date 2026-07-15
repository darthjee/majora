import React from 'react';
import FormField from '../../../../common/FormField.jsx';
import ErrorAlert from '../../../../common/ErrorAlert.jsx';
import SubmitButton from '../../../../common/SubmitButton.jsx';
import Translator from '../../../../../i18n/Translator.js';
import TreasureHelper from './TreasureHelper.jsx';
import TreasureValueField from '../elements/TreasureValueField.jsx';

/**
 * Rendering helper for the treasure edit page.
 */
export default class TreasureEditHelper {
  /**
   * Render the treasure edit form.
   *
   * @param {{name: string, value: string, gameType: string, status: string,
   *   fieldErrors: object}} formState - Form state. `gameType` is the treasure's own
   *   (fixed-at-creation) currency model name, defaulting to `dnd`.
   * @param {{onSubmit: Function, onNameChange: Function, onOpenValueModal: Function}} handlers - Event handlers.
   * @returns {React.ReactElement} Rendered edit page.
   */
  static render(formState, handlers) {
    return (
      <div className="container mt-4">
        <h1>{Translator.t('treasure_edit_page.title')}</h1>
        {TreasureEditHelper.#renderError(formState)}
        <form onSubmit={handlers.onSubmit}>
          <FormField
            id="treasure-edit-name"
            type="text"
            label={Translator.t('treasure_edit_page.name_label')}
            value={formState.name}
            onChange={handlers.onNameChange}
            errors={formState.fieldErrors.name ?? []}
          />
          <TreasureValueField
            label={Translator.t('treasure_edit_page.value_label')}
            editLabel={Translator.t('treasure_page.edit')}
            value={formState.value}
            errors={formState.fieldErrors.value ?? []}
            gameType={formState.gameType}
            onOpenModal={handlers.onOpenValueModal}
          />
          <SubmitButton disabled={formState.status === 'submitting'}>
            {Translator.t('treasure_edit_page.submit')}
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
    return TreasureHelper.renderLoading();
  }

  static #renderError(formState) {
    if (formState.status !== 'error') {
      return null;
    }

    return <ErrorAlert error={Translator.t('treasure_edit_page.error')} />;
  }
}
