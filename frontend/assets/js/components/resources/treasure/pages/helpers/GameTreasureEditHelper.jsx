import React from 'react';
import FormField from '../../../../common/FormField.jsx';
import ErrorAlert from '../../../../common/ErrorAlert.jsx';
import SubmitButton from '../../../../common/SubmitButton.jsx';
import Translator from '../../../../../i18n/Translator.js';
import GameTreasuresHelper from './GameTreasuresHelper.jsx';
import TreasureValueField from '../elements/TreasureValueField.jsx';

/**
 * Rendering helper for the game treasure edit page.
 */
export default class GameTreasureEditHelper {
  /**
   * Render the game treasure edit form.
   *
   * @param {{name: string, value: string, maxUnits: string, status: string, fieldErrors: object,
   *   isExclusive: boolean}} formState - Form state. `maxUnits` is the raw (string) form value; an
   *   empty string means unlimited (`null`). `isExclusive` marks a treasure exclusive to the game
   *   (via the `Treasure.game` FK) rather than linked through the shared M2M — the `max_units`
   *   field is hidden for exclusive treasures since the backend ignores it for them.
   * @param {{onSubmit: Function, onNameChange: Function, onOpenValueModal: Function,
   *   onMaxUnitsChange: Function}} handlers - Event handlers.
   * @returns {React.ReactElement} Rendered edit page.
   */
  static render(formState, handlers) {
    return (
      <div className="container mt-4">
        <h1>{Translator.t('game_treasure_edit_page.title')}</h1>
        {GameTreasureEditHelper.#renderError(formState)}
        <form onSubmit={handlers.onSubmit}>
          <FormField
            id="game-treasure-edit-name"
            type="text"
            label={Translator.t('game_treasure_edit_page.name_label')}
            value={formState.name}
            onChange={handlers.onNameChange}
            errors={formState.fieldErrors.name ?? []}
          />
          <TreasureValueField
            label={Translator.t('game_treasure_edit_page.value_label')}
            editLabel={Translator.t('game_treasures_page.edit')}
            value={formState.value}
            errors={formState.fieldErrors.value ?? []}
            onOpenModal={handlers.onOpenValueModal}
          />
          {GameTreasureEditHelper.#renderMaxUnits(formState, handlers)}
          <SubmitButton disabled={formState.status === 'submitting'}>
            {Translator.t('game_treasure_edit_page.submit')}
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
    return GameTreasuresHelper.renderLoading();
  }

  /**
   * Render the error state.
   *
   * @param {string} error - Error message.
   * @returns {React.ReactElement} Error alert.
   */
  static renderError(error) {
    return GameTreasuresHelper.renderError(error);
  }

  static #renderError(formState) {
    if (formState.status !== 'error') {
      return null;
    }

    return <ErrorAlert error={Translator.t('game_treasure_edit_page.error')} />;
  }

  static #renderMaxUnits(formState, handlers) {
    if (formState.isExclusive) {
      return null;
    }

    return (
      <FormField
        id="game-treasure-edit-max-units"
        type="number"
        label={Translator.t('game_treasure_edit_page.max_units_label')}
        value={formState.maxUnits}
        onChange={handlers.onMaxUnitsChange}
        errors={formState.fieldErrors.max_units ?? []}
      />
    );
  }
}
