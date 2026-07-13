import React from 'react';
import FormField from '../../../../common/FormField.jsx';
import TextareaField from '../../../../common/TextareaField.jsx';
import ErrorAlert from '../../../../common/ErrorAlert.jsx';
import SubmitButton from '../../../../common/SubmitButton.jsx';
import Translator from '../../../../../i18n/Translator.js';

/**
 * Rendering helper for the game NPC creation page.
 */
export default class GameNpcNewHelper {
  /**
   * Render the NPC creation form.
   *
   * @param {{name: string, role: string, description: string, privateDescription: string,
   *   hidden: boolean, money: string, allegiance: string, publicAllegiance: string,
   *   status: string, fieldErrors: object}} formState - Form state.
   * @param {{onSubmit: Function, onNameChange: Function, onRoleChange: Function,
   *   onDescriptionChange: Function, onPrivateDescriptionChange: Function,
   *   onHiddenChange: Function, onMoneyChange: Function, onAllegianceChange: Function,
   *   onPublicAllegianceChange: Function}} handlers - Event handlers.
   * @returns {React.ReactElement} Rendered new NPC page.
   */
  static render(formState, handlers) {
    return (
      <div className="container mt-4">
        <h1>{Translator.t('game_npc_new_page.title')}</h1>
        {GameNpcNewHelper.#renderError(formState)}
        <form onSubmit={handlers.onSubmit}>
          <FormField
            id="game-npc-new-name"
            type="text"
            label={Translator.t('game_npc_new_page.name_label')}
            value={formState.name}
            onChange={handlers.onNameChange}
            errors={formState.fieldErrors.name ?? []}
          />
          <FormField
            id="game-npc-new-role"
            type="text"
            label={Translator.t('game_npc_new_page.role_label')}
            value={formState.role}
            onChange={handlers.onRoleChange}
            errors={formState.fieldErrors.role ?? []}
          />
          <TextareaField
            id="game-npc-new-description"
            label={Translator.t('game_npc_new_page.description_label')}
            value={formState.description}
            onChange={handlers.onDescriptionChange}
            errors={formState.fieldErrors.public_description ?? []}
          />
          <TextareaField
            id="game-npc-new-private-description"
            label={Translator.t('game_npc_new_page.private_description_label')}
            value={formState.privateDescription}
            onChange={handlers.onPrivateDescriptionChange}
            errors={formState.fieldErrors.private_description ?? []}
          />
          <FormField
            id="game-npc-new-money"
            type="number"
            label={Translator.t('game_npc_new_page.money_label')}
            value={formState.money}
            onChange={handlers.onMoneyChange}
            errors={formState.fieldErrors.money ?? []}
          />
          <div className="form-check mb-3">
            <input
              id="game-npc-new-hidden"
              type="checkbox"
              className="form-check-input"
              checked={formState.hidden}
              onChange={handlers.onHiddenChange}
            />
            <label htmlFor="game-npc-new-hidden" className="form-check-label">
              {Translator.t('game_npc_new_page.hidden_label')}
            </label>
          </div>
          <div className="mb-3">
            <label htmlFor="game-npc-new-allegiance" className="form-label">
              {Translator.t('game_npc_new_page.allegiance_label')}
            </label>
            <select
              id="game-npc-new-allegiance"
              className="form-select"
              value={formState.allegiance}
              onChange={handlers.onAllegianceChange}
            >
              <option value="ally">{Translator.t('game_npc_new_page.allegiance_ally')}</option>
              <option value="enemy">{Translator.t('game_npc_new_page.allegiance_enemy')}</option>
              <option value="neutral">{Translator.t('game_npc_new_page.allegiance_neutral')}</option>
            </select>
          </div>
          <div className="mb-3">
            <label htmlFor="game-npc-new-public-allegiance" className="form-label">
              {Translator.t('game_npc_new_page.public_allegiance_label')}
            </label>
            <select
              id="game-npc-new-public-allegiance"
              className="form-select"
              value={formState.publicAllegiance}
              onChange={handlers.onPublicAllegianceChange}
            >
              <option value="ally">{Translator.t('game_npc_new_page.allegiance_ally')}</option>
              <option value="enemy">{Translator.t('game_npc_new_page.allegiance_enemy')}</option>
              <option value="neutral">{Translator.t('game_npc_new_page.allegiance_neutral')}</option>
            </select>
          </div>
          <SubmitButton disabled={formState.status === 'submitting'}>
            {Translator.t('game_npc_new_page.submit')}
          </SubmitButton>
        </form>
      </div>
    );
  }

  static #renderError(formState) {
    if (formState.status !== 'error') {
      return null;
    }

    return <ErrorAlert error={Translator.t('game_npc_new_page.error')} />;
  }
}
