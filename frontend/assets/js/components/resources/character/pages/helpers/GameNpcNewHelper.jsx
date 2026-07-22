import React from 'react';
import FormField from '../../../../common/forms/FormField.jsx';
import ErrorAlert from '../../../../common/misc/ErrorAlert.jsx';
import SubmitButton from '../../../../common/buttons/SubmitButton.jsx';
import CharacterAvatarField from '../elements/CharacterAvatarField.jsx';
import CharacterLinksField from '../elements/CharacterLinksField.jsx';
import CharacterMoneyField from '../elements/CharacterMoneyField.jsx';
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
   * @description The NPC does not exist yet, so there is no id to scope a
   *   treasures/photos breakdown to: the avatar is editable but picking a
   *   photo opens the upload modal in its deferred mode (see
   *   `PhotoUploadModal`), which just keeps the picked file in the page's own
   *   state (rendered here as `photoPreviewUrl`) until the NPC is created and
   *   the photo is actually uploaded. Before a photo is picked, the avatar
   *   shows its default static placeholder image.
   * @param {{name: string, role: string, description: string, privateDescription: string,
   *   links: object[], hidden: boolean, money: string, gameType: string, allegiance: string,
   *   publicAllegiance: string, status: string, fieldErrors: object,
   *   photoPreviewUrl: string|null}} formState - Form state.
   * @param {{onSubmit: Function, onNameChange: Function, onRoleChange: Function,
   *   onDescriptionChange: Function, onPrivateDescriptionChange: Function,
   *   onOpenLinksModal: Function, onOpenUploadModal: Function, onOpenMoneyModal: Function,
   *   onHiddenChange: Function, onAllegianceChange: Function, onPublicAllegianceChange: Function,
   *   onRetryPhotoUpload: Function, onSkipPhotoUpload: Function}} handlers - Event handlers.
   * @returns {React.ReactElement} Rendered new NPC page.
   */
  static render(formState, handlers) {
    return (
      <div className="container mt-4">
        <h1>{Translator.t('game_npc_new_page.title')}</h1>
        {GameNpcNewHelper.#renderError(formState)}
        {GameNpcNewHelper.#renderPhotoUploadFailed(formState, handlers)}
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
            {GameNpcNewHelper.#renderAvatarColumn(formState, handlers)}
            {GameNpcNewHelper.#renderDetailsColumn(formState, handlers)}
          </div>
          {GameNpcNewHelper.#renderAllegianceFields(formState, handlers)}
          {GameNpcNewHelper.#renderSubmitButton(formState)}
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

  static #renderPhotoUploadFailed(formState, handlers) {
    if (formState.status !== 'photo-upload-failed') {
      return null;
    }

    return (
      <div className="alert alert-warning">
        <p>{Translator.t('game_npc_new_page.photo_upload_failed')}</p>
        <button
          type="button"
          className="btn btn-primary me-2"
          onClick={handlers.onRetryPhotoUpload}
        >
          {Translator.t('game_npc_new_page.retry_photo_upload')}
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={handlers.onSkipPhotoUpload}
        >
          {Translator.t('game_npc_new_page.skip_photo_upload')}
        </button>
      </div>
    );
  }

  static #renderSubmitButton(formState) {
    if (formState.status === 'photo-upload-failed') {
      return null;
    }

    return (
      <SubmitButton disabled={formState.status === 'submitting'}>
        {Translator.t('game_npc_new_page.submit')}
      </SubmitButton>
    );
  }

  static #renderAvatarColumn(formState, handlers) {
    return (
      <div className="col-md-4">
        <CharacterAvatarField
          canEdit
          url={formState.photoPreviewUrl}
          alt={formState.name}
          dimmed={formState.hidden}
          onClick={handlers.onOpenUploadModal}
        />
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
        <CharacterMoneyField
          isFullEditor
          label={Translator.t('game_npc_new_page.money_label')}
          money={formState.money}
          treasureValue={0}
          gameType={formState.gameType}
          buttonLabel={Translator.t('game_npc_new_page.edit_money_button')}
          onOpenMoneyModal={handlers.onOpenMoneyModal}
          errors={formState.fieldErrors.money ?? []}
        />
      </div>
    );
  }

  static #renderDetailsColumn(formState, handlers) {
    return (
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
    );
  }

  static #renderAllegianceFields(formState, handlers) {
    return (
      <>
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
      </>
    );
  }
}
