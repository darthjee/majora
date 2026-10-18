import React from 'react';
import ApiTokenScopes from '../../../../../common/api_tokens/ApiTokenScopes.js';
import FieldErrors from '../../../../../common/forms/FieldErrors.jsx';
import ApiTokenScopeCheckbox from '../ApiTokenScopeCheckbox.jsx';
import Translator from '../../../../../../i18n/Translator.js';

/**
 * Renders the API token scope picker (issue #1605).
 */
export default class ApiTokenScopePickerHelper {
  /**
   * Render the shortcuts, the grouped Read/Write table, the scopes note and the field errors.
   *
   * @param {{value: Array<string>, scopes: Array<string>, errors: Array<string>}} state -
   *   Selected scopes, the `options.json` catalogue and the `scopes` field errors.
   * @param {{onToggle: Function, onSelectAllRead: Function, onSelectAllWrite: Function,
   *   onClear: Function}} handlers - Checkbox and shortcut handlers.
   * @returns {React.ReactElement} Rendered scope picker.
   */
  static render(state, handlers) {
    return (
      <div className="mb-3" data-testid="api-token-scope-picker">
        <span className="form-label d-block">{Translator.t('api_tokens_page.scopes_label')}</span>
        {ApiTokenScopePickerHelper.#renderShortcuts(handlers)}
        <table className="table table-sm align-middle">
          <thead>
            <tr>
              <th>{Translator.t('api_tokens_page.col_scopes')}</th>
              <th className="text-center">{Translator.t('api_tokens_page.read')}</th>
              <th className="text-center">{Translator.t('api_tokens_page.write')}</th>
            </tr>
          </thead>
          <tbody>
            {ApiTokenScopes.groupScopes(state.scopes).map((group) => (
              <React.Fragment key={group.group}>
                <tr>
                  <th colSpan={3}>{Translator.t(`api_tokens_page.group_${group.group}`)}</th>
                </tr>
                {group.families.map((family) => ApiTokenScopePickerHelper.#renderRow(family, state.value, handlers))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
        <p className="form-text">{Translator.t('api_tokens_page.scopes_note')}</p>
        <FieldErrors errors={state.errors} />
      </div>
    );
  }

  /**
   * Render the "Select all read", "Select all write" and "Clear" shortcut buttons.
   *
   * @param {{onSelectAllRead: Function, onSelectAllWrite: Function, onClear: Function}} handlers
   *   - Shortcut handlers.
   * @returns {React.ReactElement} Shortcut buttons.
   */
  static #renderShortcuts(handlers) {
    return (
      <div className="d-flex gap-2 mb-2">
        <button type="button" className="btn btn-outline-secondary btn-sm" onClick={handlers.onSelectAllRead}>
          {Translator.t('api_tokens_page.select_all_read')}
        </button>
        <button type="button" className="btn btn-outline-secondary btn-sm" onClick={handlers.onSelectAllWrite}>
          {Translator.t('api_tokens_page.select_all_write')}
        </button>
        <button type="button" className="btn btn-outline-secondary btn-sm" onClick={handlers.onClear}>
          {Translator.t('api_tokens_page.clear')}
        </button>
      </div>
    );
  }

  /**
   * Render one family row: its label, help line and Read/Write checkboxes.
   *
   * @param {{family: string, read: boolean, write: boolean}} family - The family and which of
   *   its actions exist in the catalogue.
   * @param {Array<string>} value - Selected scopes.
   * @param {{onToggle: Function}} handlers - Checkbox handler.
   * @returns {React.ReactElement} Family row.
   */
  static #renderRow(family, value, handlers) {
    const name = family.family;

    return (
      <tr key={name}>
        <td>
          <div>{Translator.t(`api_tokens_page.family_${name}`)}</div>
          <small className="text-muted">{Translator.t(`api_tokens_page.family_${name}_help`)}</small>
        </td>
        {['read', 'write'].map((action) => (
          <td key={action} className="text-center">
            <ApiTokenScopeCheckbox
              family={name}
              action={action}
              available={family[action]}
              checked={value.includes(`${name}:${action}`)}
              onToggle={handlers.onToggle}
            />
          </td>
        ))}
      </tr>
    );
  }
}
