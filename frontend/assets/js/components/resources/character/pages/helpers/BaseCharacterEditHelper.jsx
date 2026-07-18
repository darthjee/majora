import React from 'react';
import FormField from '../../../../common/forms/FormField.jsx';
import ErrorAlert from '../../../../common/misc/ErrorAlert.jsx';
import LoadingMessage from '../../../../common/misc/LoadingMessage.jsx';
import CharacterAvatarField from '../elements/CharacterAvatarField.jsx';
import CharacterLinksField from '../elements/CharacterLinksField.jsx';
import CharacterMoneyField from '../elements/CharacterMoneyField.jsx';
import CharacterRoleField from '../elements/CharacterRoleField.jsx';
import CharacterDescriptionField from '../elements/CharacterDescriptionField.jsx';
import CharacterDmNotesField from '../elements/CharacterDmNotesField.jsx';
import Translator from '../../../../../i18n/Translator.js';

/**
 * Shared rendering helper for character edit pages.
 *
 * @description Instantiated with an idPrefix and i18nNamespace to produce
 *   a type-specific edit-page helper (NPC or PC).
 */
export default class BaseCharacterEditHelper {
  /**
   * Create a character edit helper.
   *
   * @param {string} idPrefix - HTML field ID prefix (e.g. 'npc' or 'pc').
   * @param {string} i18nNamespace - Translation namespace (e.g. 'npc_edit_page' or 'pc_edit_page').
   */
  constructor(idPrefix, i18nNamespace) {
    this.idPrefix = idPrefix;
    this.i18nNamespace = i18nNamespace;
  }

  /**
   * Render the edit form.
   *
   * @description `state.links` may include entries marked `delete: true` (kept so the
   *   "Edit links" modal can restore them); those are filtered out of the visible
   *   `LinkList` here. `money` and `private_description` are dm/admin-only
   *   (`state.isFullEditor`); `name` and `role` are dm/admin-only for a PC but visible/editable
   *   for any NPC editor (a player editor only ever reaches this render for an NPC, since
   *   `CharacterEdit.jsx` redirects everyone else away first); `public_description`, `links`,
   *   allegiance, and the slain toggle are visible/editable regardless of editor kind.
   * @param {{isFullEditor: boolean, name: string, profile_photo_path: string|null,
   *   links: object[], role: string, description: string, privateDescription: string,
   *   money: string, treasureValue: number, gameType: string, allegiance: string,
   *   publicAllegiance: string, publicSlain: boolean, hidden: boolean, status: string,
   *   fieldErrors: object}} state - page
   *   state. `gameType` is the currency model name (e.g. `dnd`, `deadlands`) of the character's
   *   own game, defaulting to `dnd`. `hidden` is NPC-only and DM/admin-only. `treasureValue` is
   *   the character's read-only treasure value (issue #616), rendered alongside `money`.
   * @param {{onSubmit: Function, onNameChange: Function,
   *   onRoleChange: Function,
   *   onDescriptionChange: Function, onPrivateDescriptionChange: Function,
   *   onMoneyChange: Function, onOpenUploadModal: Function, onOpenLinksModal: Function,
   *   onOpenMoneyModal: Function,
   *   onAllegianceChange: Function,
   *   onPublicAllegianceChange: Function,
   *   onPublicSlainChange: Function,
   *   onHiddenChange: Function}} handlers - event handlers.
   * @returns {React.ReactElement} rendered edit page.
   */
  render(state, handlers) {
    const { idPrefix, i18nNamespace } = this;

    return (
      <div className="container mt-4">
        <h1>{Translator.t(`${i18nNamespace}.title`)}</h1>
        {this.#renderError(state)}
        <form onSubmit={handlers.onSubmit}>
          <div className="row">
            <div className="col-md-4">
              <CharacterAvatarField
                url={state.profile_photo_path}
                alt={state.name}
                onClick={handlers.onOpenUploadModal}
                dimmed={state.hidden}
              />
              {this.#renderHiddenField(state, handlers)}
              {this.#renderNameField(state, handlers)}
              <CharacterLinksField
                links={state.links}
                buttonLabel={Translator.t(`${i18nNamespace}.edit_links_button`)}
                onOpenLinksModal={handlers.onOpenLinksModal}
              />
              <CharacterMoneyField
                isFullEditor={state.isFullEditor}
                label={Translator.t(`${i18nNamespace}.money_label`)}
                money={state.money}
                treasureValue={state.treasureValue}
                gameType={state.gameType}
                buttonLabel={Translator.t(`${i18nNamespace}.edit_money_button`)}
                onOpenMoneyModal={handlers.onOpenMoneyModal}
                errors={state.fieldErrors.money ?? []}
              />
              {this.#renderAllegianceFields(state, handlers)}
              {this.#renderSlainField(state, handlers)}
            </div>
            <div className="col-md-8">
              <CharacterRoleField
                // Really "can see/edit this field": always true for an NPC editor
                // (player or full), since anyone reaching this render for an NPC may
                // already edit name/role; still full-editor-only for a PC.
                isFullEditor={state.isFullEditor || this.idPrefix === 'npc'}
                id={`${idPrefix}-edit-role`}
                label={Translator.t(`${i18nNamespace}.role_label`)}
                value={state.role}
                onChange={handlers.onRoleChange}
                errors={state.fieldErrors.role ?? []}
              />
              <CharacterDescriptionField
                id={`${idPrefix}-edit-description`}
                label={Translator.t(`${i18nNamespace}.description_label`)}
                value={state.description}
                onChange={handlers.onDescriptionChange}
                errors={state.fieldErrors.public_description ?? []}
              />
              <CharacterDmNotesField
                isFullEditor={state.isFullEditor}
                id={`${idPrefix}-edit-private-description`}
                label={Translator.t(`${i18nNamespace}.private_description_label`)}
                value={state.privateDescription}
                onChange={handlers.onPrivateDescriptionChange}
                errors={state.fieldErrors.private_description ?? []}
              />
              <button className="btn btn-primary" type="submit" disabled={state.status === 'submitting'}>
                {Translator.t(`${i18nNamespace}.submit`)}
              </button>
            </div>
          </div>
        </form>
      </div>
    );
  }

  /**
   * Render the loading state.
   *
   * @returns {React.ReactElement} Loading message.
   */
  renderLoading() {
    return <LoadingMessage message={Translator.t('character_page.loading')} />;
  }

  #renderError(state) {
    if (state.status !== 'error') {
      return null;
    }

    return <ErrorAlert error={Translator.t(`${this.i18nNamespace}.error`)} />;
  }

  #renderAllegianceFields(state, handlers) {
    if (this.idPrefix !== 'npc') {
      return null;
    }

    const { idPrefix, i18nNamespace } = this;

    return (
      <>
        <div className="mb-3">
          <label htmlFor={`${idPrefix}-edit-allegiance`} className="form-label">
            {Translator.t(`${i18nNamespace}.allegiance_label`)}
          </label>
          <select
            id={`${idPrefix}-edit-allegiance`}
            className="form-select"
            value={state.allegiance}
            onChange={handlers.onAllegianceChange}
          >
            <option value="ally">{Translator.t(`${i18nNamespace}.allegiance_ally`)}</option>
            <option value="enemy">{Translator.t(`${i18nNamespace}.allegiance_enemy`)}</option>
            <option value="neutral">{Translator.t(`${i18nNamespace}.allegiance_neutral`)}</option>
          </select>
        </div>
        <div className="mb-3">
          <label htmlFor={`${idPrefix}-edit-public-allegiance`} className="form-label">
            {Translator.t(`${i18nNamespace}.public_allegiance_label`)}
          </label>
          <select
            id={`${idPrefix}-edit-public-allegiance`}
            className="form-select"
            value={state.publicAllegiance}
            onChange={handlers.onPublicAllegianceChange}
          >
            <option value="ally">{Translator.t(`${i18nNamespace}.allegiance_ally`)}</option>
            <option value="enemy">{Translator.t(`${i18nNamespace}.allegiance_enemy`)}</option>
            <option value="neutral">{Translator.t(`${i18nNamespace}.allegiance_neutral`)}</option>
          </select>
        </div>
      </>
    );
  }

  #renderNameField(state, handlers) {
    if (this.idPrefix !== 'npc' && !state.isFullEditor) {
      return null;
    }

    const { idPrefix, i18nNamespace } = this;

    return (
      <FormField
        id={`${idPrefix}-edit-name`}
        type="text"
        label={Translator.t(`${i18nNamespace}.name_label`)}
        value={state.name}
        onChange={handlers.onNameChange}
        errors={state.fieldErrors.name ?? []}
      />
    );
  }

  #renderHiddenField(state, handlers) {
    if (this.idPrefix !== 'npc' || !state.isFullEditor) {
      return null;
    }

    const { idPrefix, i18nNamespace } = this;

    return (
      <div className="form-check form-switch mb-3">
        <input
          id={`${idPrefix}-edit-hidden`}
          type="checkbox"
          role="switch"
          className="form-check-input"
          checked={state.hidden}
          onChange={handlers.onHiddenChange}
        />
        <label htmlFor={`${idPrefix}-edit-hidden`} className="form-check-label">
          {Translator.t(`${i18nNamespace}.hidden_label`)}
        </label>
      </div>
    );
  }

  #renderSlainField(state, handlers) {
    if (this.idPrefix !== 'npc') {
      return null;
    }

    const { idPrefix } = this;

    return (
      <div className="form-check mb-3">
        <input
          id={`${idPrefix}-edit-public-slain`}
          type="checkbox"
          className="form-check-input"
          checked={state.publicSlain}
          onChange={handlers.onPublicSlainChange}
        />
        <label htmlFor={`${idPrefix}-edit-public-slain`} className="form-check-label">
          {Translator.t('character_status_badges.public_slain')}
        </label>
      </div>
    );
  }
}
