import React from 'react';
import FormField from '../../../../common/FormField.jsx';
import ErrorAlert from '../../../../common/ErrorAlert.jsx';
import SubmitButton from '../../../../common/SubmitButton.jsx';
import CharacterAvatarField from '../elements/CharacterAvatarField.jsx';
import CharacterLinksField from '../elements/CharacterLinksField.jsx';
import CharacterRoleField from '../elements/CharacterRoleField.jsx';
import CharacterDescriptionField from '../elements/CharacterDescriptionField.jsx';
import CharacterDmNotesField from '../elements/CharacterDmNotesField.jsx';
import Translator from '../../../../../i18n/Translator.js';

/**
 * Rendering helper for the game NPC creation page.
 */
export default class GameNpcNewHelper {
  /**
   * Render the NPC creation form.
   *
   * @description The NPC does not exist yet, so there is no id to scope an avatar
   *   upload or a money/treasures/photos breakdown to: the avatar is a static
   *   placeholder (no upload control) and money stays a raw number field below
   *   the columns, matching this app's existing precedent of deferring photo
   *   upload to after the entity exists.
   * @param {{name: string, role: string, description: string, privateDescription: string,
   *   links: object[], hidden: boolean, money: string, allegiance: string,
   *   publicAllegiance: string, status: string, fieldErrors: object}} formState - Form state.
   * @param {{onSubmit: Function, onNameChange: Function, onRoleChange: Function,
   *   onDescriptionChange: Function, onPrivateDescriptionChange: Function,
   *   onOpenLinksModal: Function, onHiddenChange: Function, onMoneyChange: Function,
   *   onAllegianceChange: Function, onPublicAllegianceChange: Function}} handlers - Event handlers.
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
          <div className="row">
            <div className="col-md-4">
              <CharacterAvatarField canEdit={false} alt={formState.name} dimmed={formState.hidden} />
              <div className="form-check form-switch mb-3">
                <input
                  id="game-npc-new-hidden"
                  type="checkbox"
                  role="switch"
                  className="form-check-input"
                  checked={formState.hidden}
                  onChange={handlers.onHiddenChange}
                />
                <label htmlFor="game-npc-new-hidden" className="form-check-label">
                  {Translator.t('game_npc_new_page.hidden_label')}
                </label>
              </div>
              <CharacterLinksField
                links={formState.links}
                buttonLabel={Translator.t('npc_edit_page.edit_links_button')}
                onOpenLinksModal={handlers.onOpenLinksModal}
              />
            </div>
            <div className="col-md-8">
              <CharacterRoleField
                isFullEditor
                id="game-npc-new-role"
                label={Translator.t('game_npc_new_page.role_label')}
                value={formState.role}
                onChange={handlers.onRoleChange}
                errors={formState.fieldErrors.role ?? []}
              />
              <CharacterDescriptionField
                id="game-npc-new-description"
                label={Translator.t('game_npc_new_page.description_label')}
                value={formState.description}
                onChange={handlers.onDescriptionChange}
                errors={formState.fieldErrors.public_description ?? []}
              />
              <CharacterDmNotesField
                isFullEditor
                id="game-npc-new-private-description"
                label={Translator.t('game_npc_new_page.private_description_label')}
                value={formState.privateDescription}
                onChange={handlers.onPrivateDescriptionChange}
                errors={formState.fieldErrors.private_description ?? []}
              />
            </div>
          </div>
          <FormField
            id="game-npc-new-money"
            type="number"
            label={Translator.t('game_npc_new_page.money_label')}
            value={formState.money}
            onChange={handlers.onMoneyChange}
            errors={formState.fieldErrors.money ?? []}
          />
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
