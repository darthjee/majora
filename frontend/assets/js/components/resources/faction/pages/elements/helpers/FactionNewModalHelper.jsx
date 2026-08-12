import Modal from 'react-bootstrap/cjs/Modal.js';
import FormField from '../../../../../common/forms/FormField.jsx';
import SubmitButton from '../../../../../common/buttons/SubmitButton.jsx';
import Translator from '../../../../../../i18n/Translator.js';
import FactionPhotoField from '../FactionPhotoField.jsx';
import FactionNewPhotoUploadFailedAlert from '../show/FactionNewPhotoUploadFailedAlert.jsx';

/**
 * Rendering helper for the "New Faction" modal (issue #812): a single-column form (photo, then
 * name) inside `Modal.Body`, with a full-width submit button as the `Modal.Footer`, mirroring
 * `SourceNewModalHelper` exactly minus the `url` field — `Faction` has no analogous field.
 */
export default class FactionNewModalHelper {
  /**
   * Render the "New Faction" modal.
   *
   * @param {boolean} show - Whether the modal is visible.
   * @param {{name: string, status: string, fieldErrors: object, photoPreviewUrl: string|null}} formState -
   *   Form state. `photoPreviewUrl` is a local object URL for the picked-but-not-yet-uploaded
   *   photo, or null before a photo is picked (renders the default `default_faction.png`
   *   placeholder).
   * @param {{onClose: Function, onSubmit: Function, onNameChange: Function,
   *   onOpenUploadModal: Function, onRetryPhotoUpload: Function,
   *   onSkipPhotoUpload: Function}} handlers - Event handlers.
   * @returns {React.ReactElement} Rendered "New Faction" modal.
   */
  static render(show, formState, handlers) {
    return (
      <Modal show={show} onHide={handlers.onClose}>
        <form onSubmit={handlers.onSubmit}>
          <Modal.Header closeButton>
            <Modal.Title>{Translator.t('faction_new_page.title')}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {FactionNewModalHelper.#renderError(formState)}
            {FactionNewModalHelper.#renderPhotoUploadFailed(formState, handlers)}
            <FactionPhotoField
              url={formState.photoPreviewUrl}
              alt={formState.name}
              onClick={handlers.onOpenUploadModal}
            />
            <FormField
              id="faction-new-name"
              type="text"
              label={Translator.t('faction_new_page.name_label')}
              value={formState.name}
              onChange={handlers.onNameChange}
              errors={formState.fieldErrors.name ?? []}
            />
          </Modal.Body>
          <Modal.Footer>
            <SubmitButton disabled={formState.status === 'submitting'}>
              {Translator.t('faction_new_page.submit')}
            </SubmitButton>
          </Modal.Footer>
        </form>
      </Modal>
    );
  }

  static #renderError(formState) {
    if (formState.status !== 'error') {
      return null;
    }

    return <div className="alert alert-danger">{Translator.t('faction_new_page.error')}</div>;
  }

  static #renderPhotoUploadFailed(formState, handlers) {
    if (formState.status !== 'photo-upload-failed') {
      return null;
    }

    return <FactionNewPhotoUploadFailedAlert handlers={handlers} />;
  }
}
