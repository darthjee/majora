import React from 'react';
import CardAvatar from '../../elements/CardAvatar.jsx';
import FormField from '../../elements/FormField.jsx';
import ErrorAlert from '../../elements/ErrorAlert.jsx';
import LoadingMessage from '../../elements/LoadingMessage.jsx';
import Translator from '../../../i18n/Translator.js';

/**
 * Rendering helper for the NPC character edit page.
 */
export default class NpcCharacterEditHelper {
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
  static render(state, handlers) {
    return (
      <div className="container mt-4">
        <h1>{Translator.t('npc_edit_page.title')}</h1>
        {NpcCharacterEditHelper.#renderError(state)}
        <div className="row">
          <div className="col-md-4">
            <CardAvatar url={state.avatar_url} alt={state.name} />
          </div>
          <div className="col-md-8">
            <form onSubmit={handlers.onSubmit}>
              <FormField
                id="npc-edit-name"
                type="text"
                label={Translator.t('npc_edit_page.name_label')}
                value={state.name}
                onChange={handlers.onNameChange}
                errors={state.fieldErrors.name ?? []}
              />
              <FormField
                id="npc-edit-avatar-url"
                type="text"
                label={Translator.t('npc_edit_page.avatar_url_label')}
                value={state.avatar_url}
                onChange={handlers.onAvatarUrlChange}
                errors={state.fieldErrors.avatar_url ?? []}
              />
              <FormField
                id="npc-edit-character-class"
                type="text"
                label={Translator.t('npc_edit_page.character_class_label')}
                value={state.character_class}
                onChange={handlers.onCharacterClassChange}
                errors={state.fieldErrors.character_class ?? []}
              />
              <FormField
                id="npc-edit-level"
                type="number"
                label={Translator.t('npc_edit_page.level_label')}
                value={state.level}
                onChange={handlers.onLevelChange}
                errors={state.fieldErrors.level ?? []}
              />
              <FormField
                id="npc-edit-description"
                type="text"
                label={Translator.t('npc_edit_page.description_label')}
                value={state.description}
                onChange={handlers.onDescriptionChange}
                errors={state.fieldErrors.public_description ?? []}
              />
              <FormField
                id="npc-edit-private-description"
                type="text"
                label={Translator.t('npc_edit_page.private_description_label')}
                value={state.privateDescription}
                onChange={handlers.onPrivateDescriptionChange}
                errors={state.fieldErrors.private_description ?? []}
              />
              <button className="btn btn-primary" type="submit" disabled={state.status === 'submitting'}>
                {Translator.t('npc_edit_page.submit')}
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
  static renderLoading() {
    return <LoadingMessage message={Translator.t('character_page.loading')} />;
  }

  static #renderError(state) {
    if (state.status !== 'error') {
      return null;
    }

    return <ErrorAlert error={Translator.t('npc_edit_page.error')} />;
  }
}
