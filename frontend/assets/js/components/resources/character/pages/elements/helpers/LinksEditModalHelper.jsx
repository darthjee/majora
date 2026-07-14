import Modal from 'react-bootstrap/cjs/Modal.js';
import Translator from '../../../../../../i18n/Translator.js';
import Icons from '../../../../../../utils/ui/Icons.js';
import FormField from '../../../../../common/FormField.jsx';
import LinkIcon, { LINK_TYPE_ICONS } from '../../../../../common/LinkIcon.jsx';

const LINK_TYPE_VALUES = ['', ...Object.keys(LINK_TYPE_ICONS)];

/**
 * Renders the "Edit links" modal shell: a list of link blocks, an "Add Link"
 * button, and Confirm/Cancel footer actions.
 */
export default class LinksEditModalHelper {
  /**
   * Renders the links edit modal.
   *
   * @param {boolean} show - Whether the modal is visible.
   * @param {object} state - Modal state.
   * @param {object[]} state.links - Local links array being edited.
   * @param {boolean} state.canConfirm - Whether every active (non-deleted) link has a URL.
   * @param {object} handlers - Modal event handlers (`onClose`, `onConfirm`, `onAddLink`,
   *   `onToggleDelete`, `onTextChange`, `onUrlChange`, `onLinkTypeChange`).
   * @returns {React.ReactElement} Rendered links edit modal.
   */
  static render(show, state, handlers) {
    return (
      <Modal show={show} onHide={handlers.onClose}>
        <Modal.Header closeButton>
          <Modal.Title>{Translator.t('links_edit_modal.title')}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {state.links.map((link, index) => LinksEditModalHelper.#renderLinkBlock(link, index, handlers))}
          <button type="button" className="btn btn-outline-secondary btn-sm" onClick={handlers.onAddLink}>
            {Translator.t('links_edit_modal.add_link')}
          </button>
        </Modal.Body>
        <Modal.Footer>
          <button type="button" className="btn btn-secondary" onClick={handlers.onClose}>
            {Translator.t('links_edit_modal.cancel')}
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={!state.canConfirm}
            onClick={handlers.onConfirm}
          >
            {Translator.t('links_edit_modal.confirm')}
          </button>
        </Modal.Footer>
      </Modal>
    );
  }

  static #renderLinkBlock(link, index, handlers) {
    if (link.delete) {
      return LinksEditModalHelper.#renderDeletedLinkBlock(link, index, handlers);
    }

    return (
      <div className="border rounded p-2 mb-3" key={index}>
        <div className="d-flex justify-content-end">
          <button
            type="button"
            className="btn btn-link text-danger p-0"
            onClick={() => handlers.onToggleDelete(index)}
          >
            <i className={`bi ${Icons.trash}`} aria-hidden="true"></i>
          </button>
        </div>
        <FormField
          id={`links-edit-text-${index}`}
          type="text"
          label={Translator.t('links_edit_modal.text_label')}
          value={link.text ?? ''}
          onChange={(event) => handlers.onTextChange(index, event.target.value)}
        />
        <FormField
          id={`links-edit-url-${index}`}
          type="text"
          label={Translator.t('links_edit_modal.url_label')}
          value={link.url ?? ''}
          onChange={(event) => handlers.onUrlChange(index, event.target.value)}
        />
        {LinksEditModalHelper.#renderLinkTypeField(link, index, handlers)}
      </div>
    );
  }

  static #renderDeletedLinkBlock(link, index, handlers) {
    return (
      <div className="border rounded p-2 mb-3 d-flex justify-content-between align-items-center" key={index}>
        <span className="text-muted text-decoration-line-through">{link.text || link.url}</span>
        <button
          type="button"
          className="btn btn-link p-0"
          onClick={() => handlers.onToggleDelete(index)}
        >
          <i className={`bi ${Icons.restore}`} aria-hidden="true"></i>
        </button>
      </div>
    );
  }

  static #renderLinkTypeField(link, index, handlers) {
    const value = link.link_type ?? '';
    const fieldId = `links-edit-type-${index}`;

    return (
      <div className="mb-3">
        <label htmlFor={fieldId} className="form-label">
          {Translator.t('links_edit_modal.link_type_label')}
        </label>
        <div className="d-flex align-items-center gap-2">
          <LinkIcon linkType={value} />
          <select
            id={fieldId}
            className="form-select"
            value={value}
            onChange={(event) => handlers.onLinkTypeChange(index, event.target.value)}
          >
            {LINK_TYPE_VALUES.map((type) => (
              <option key={type || 'none'} value={type}>
                {Translator.t(`links_edit_modal.link_type_${type || 'none'}`)}
              </option>
            ))}
          </select>
        </div>
      </div>
    );
  }
}
