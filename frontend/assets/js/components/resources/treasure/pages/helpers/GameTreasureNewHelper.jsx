import React from 'react';
import FormField from '../../../../common/FormField.jsx';
import ErrorAlert from '../../../../common/ErrorAlert.jsx';
import SubmitButton from '../../../../common/SubmitButton.jsx';
import Translator from '../../../../../i18n/Translator.js';
import TreasureValueField from '../elements/TreasureValueField.jsx';

/**
 * Rendering helper for the game treasure creation page.
 */
export default class GameTreasureNewHelper {
  /**
   * Render the game treasure creation form.
   *
   * @param {{name: string, value: string, status: string, fieldErrors: object}} formState - Form state.
   * @param {{onSubmit: Function, onNameChange: Function, onOpenValueModal: Function}} handlers - Event handlers.
   * @returns {React.ReactElement} Rendered new treasure page.
   */
  static render(formState, handlers) {
    return (
      <div className="container mt-4">
        <h1>{Translator.t('game_treasure_new_page.title')}</h1>
        {GameTreasureNewHelper.#renderError(formState)}
        <form onSubmit={handlers.onSubmit}>
          <FormField
            id="game-treasure-new-name"
            type="text"
            label={Translator.t('game_treasure_new_page.name_label')}
            value={formState.name}
            onChange={handlers.onNameChange}
            errors={formState.fieldErrors.name ?? []}
          />
          <TreasureValueField
            label={Translator.t('game_treasure_new_page.value_label')}
            editLabel={Translator.t('game_treasures_page.edit')}
            value={formState.value}
            errors={formState.fieldErrors.value ?? []}
            onOpenModal={handlers.onOpenValueModal}
          />
          <SubmitButton disabled={formState.status === 'submitting'}>
            {Translator.t('game_treasure_new_page.submit')}
          </SubmitButton>
        </form>
      </div>
    );
  }

  static #renderError(formState) {
    if (formState.status !== 'error') {
      return null;
    }

    return <ErrorAlert error={Translator.t('game_treasure_new_page.error')} />;
  }
}
