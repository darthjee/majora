import React from 'react';
import ActionsOverlay from '../../elements/ActionsOverlay.jsx';
import FormField from '../../elements/FormField.jsx';
import TextareaField from '../../elements/TextareaField.jsx';
import ErrorAlert from '../../elements/ErrorAlert.jsx';
import LinkList from '../../elements/LinkList.jsx';
import LoadingMessage from '../../elements/LoadingMessage.jsx';
import Translator from '../../../i18n/Translator.js';

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
   *   `LinkList` here.
   * @param {{name: string, profile_photo_path: string|null, links: object[],
   *   role: string, description: string, privateDescription: string, money: string,
   *   allegiance: string, publicAllegiance: string,
   *   status: string, fieldErrors: object}} state - page state.
   * @param {{onSubmit: Function, onNameChange: Function,
   *   onRoleChange: Function,
   *   onDescriptionChange: Function, onPrivateDescriptionChange: Function,
   *   onMoneyChange: Function, onOpenUploadModal: Function, onOpenLinksModal: Function,
   *   onAllegianceChange: Function,
   *   onPublicAllegianceChange: Function}} handlers - event handlers.
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
              <ActionsOverlay
                type="avatar"
                url={state.profile_photo_path}
                alt={state.name}
                canEdit
                onClick={handlers.onOpenUploadModal}
              />
              <FormField
                id={`${idPrefix}-edit-name`}
                type="text"
                label={Translator.t(`${i18nNamespace}.name_label`)}
                value={state.name}
                onChange={handlers.onNameChange}
                errors={state.fieldErrors.name ?? []}
              />
              <LinkList links={state.links.filter((link) => !link.delete)} />
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm mb-3"
                onClick={handlers.onOpenLinksModal}
              >
                {Translator.t(`${i18nNamespace}.edit_links_button`)}
              </button>
              <FormField
                id={`${idPrefix}-edit-money`}
                type="number"
                label={Translator.t(`${i18nNamespace}.money_label`)}
                value={state.money}
                onChange={handlers.onMoneyChange}
                errors={state.fieldErrors.money ?? []}
              />
              {this.#renderAllegianceFields(state, handlers)}
            </div>
            <div className="col-md-8">
              <FormField
                id={`${idPrefix}-edit-role`}
                type="text"
                label={Translator.t(`${i18nNamespace}.role_label`)}
                value={state.role}
                onChange={handlers.onRoleChange}
                errors={state.fieldErrors.role ?? []}
              />
              <TextareaField
                id={`${idPrefix}-edit-description`}
                label={Translator.t(`${i18nNamespace}.description_label`)}
                value={state.description}
                onChange={handlers.onDescriptionChange}
                errors={state.fieldErrors.public_description ?? []}
              />
              <TextareaField
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
}
