import React from 'react';
import CardAvatar from '../../elements/CardAvatar.jsx';
import FormField from '../../elements/FormField.jsx';
import TextareaField from '../../elements/TextareaField.jsx';
import ErrorAlert from '../../elements/ErrorAlert.jsx';
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
   * @param {{name: string, avatar_url: string, character_class: string, level: string,
   *   description: string, privateDescription: string, status: string, fieldErrors: object}} state - page state.
   * @param {{onSubmit: Function, onNameChange: Function, onAvatarUrlChange: Function,
   *   onCharacterClassChange: Function, onLevelChange: Function,
   *   onDescriptionChange: Function, onPrivateDescriptionChange: Function}} handlers - event handlers.
   * @returns {React.ReactElement} rendered edit page.
   */
  render(state, handlers) {
    const { idPrefix, i18nNamespace } = this;

    return (
      <div className="container mt-4">
        <h1>{Translator.t(`${i18nNamespace}.title`)}</h1>
        {this.#renderError(state)}
        <div className="row">
          <div className="col-md-4">
            <CardAvatar url={state.avatar_url} alt={state.name} />
          </div>
          <div className="col-md-8">
            <form onSubmit={handlers.onSubmit}>
              <FormField
                id={`${idPrefix}-edit-name`}
                type="text"
                label={Translator.t(`${i18nNamespace}.name_label`)}
                value={state.name}
                onChange={handlers.onNameChange}
                errors={state.fieldErrors.name ?? []}
              />
              <FormField
                id={`${idPrefix}-edit-avatar-url`}
                type="text"
                label={Translator.t(`${i18nNamespace}.avatar_url_label`)}
                value={state.avatar_url}
                onChange={handlers.onAvatarUrlChange}
                errors={state.fieldErrors.avatar_url ?? []}
              />
              <FormField
                id={`${idPrefix}-edit-character-class`}
                type="text"
                label={Translator.t(`${i18nNamespace}.character_class_label`)}
                value={state.character_class}
                onChange={handlers.onCharacterClassChange}
                errors={state.fieldErrors.character_class ?? []}
              />
              <FormField
                id={`${idPrefix}-edit-level`}
                type="number"
                label={Translator.t(`${i18nNamespace}.level_label`)}
                value={state.level}
                onChange={handlers.onLevelChange}
                errors={state.fieldErrors.level ?? []}
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
            </form>
          </div>
        </div>
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
}
