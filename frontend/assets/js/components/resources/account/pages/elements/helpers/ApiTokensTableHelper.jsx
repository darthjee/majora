import ApiTokenCellsHelper from '../../../../../common/api_tokens/ApiTokenCellsHelper.jsx';
import ApiTokenRenameField from '../ApiTokenRenameField.jsx';
import Translator from '../../../../../../i18n/Translator.js';

const COLUMNS = ['name', 'prefix', 'scopes', 'games', 'expires', 'last_used', 'created', 'status', 'actions'];

/**
 * Renders the owner's API tokens table (issue #1605).
 */
export default class ApiTokensTableHelper {
  /**
   * Render the table: one row per token, using the shared `ApiTokenCellsHelper` cells plus the
   * inline rename and the actions cell.
   *
   * @param {Array<object>} tokens - Token items, in API order.
   * @param {({id: number, name: string, errors: object}|null)} renaming - The row being renamed.
   * @param {object} handlers - Row handlers (see `ApiTokensTable`).
   * @returns {React.ReactElement} Rendered table.
   */
  static render(tokens, renaming, handlers) {
    return (
      <div className="table-responsive">
        <table className="table align-middle" data-testid="api-tokens-table">
          <thead>
            <tr>
              {COLUMNS.map((column) => <th key={column}>{Translator.t(`api_tokens_page.col_${column}`)}</th>)}
            </tr>
          </thead>
          <tbody>
            {tokens.map((token) => {
              const editing = renaming?.id === token.id ? renaming : null;

              return (
                <tr key={token.id} data-testid={`api-token-row-${token.id}`}>
                  <td>{ApiTokensTableHelper.#renderName(token, editing, handlers)}</td>
                  <td>{ApiTokenCellsHelper.renderPrefix(token)}</td>
                  <td>{ApiTokenCellsHelper.renderScopes(token)}</td>
                  <td>{ApiTokenCellsHelper.renderGames(token)}</td>
                  <td>{ApiTokenCellsHelper.renderExpires(token)}</td>
                  <td>{ApiTokenCellsHelper.renderLastUsed(token)}</td>
                  <td>{ApiTokenCellsHelper.renderCreated(token)}</td>
                  <td>{ApiTokenCellsHelper.renderStatus(token)}</td>
                  <td className="text-nowrap">{ApiTokensTableHelper.#renderActions(token, editing, handlers)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  /**
   * Render the name cell: the inline rename input while editing, the name otherwise.
   *
   * @param {object} token - Token item.
   * @param {({name: string, errors: object}|null)} editing - The rename state of this row.
   * @param {object} handlers - Row handlers.
   * @returns {React.ReactElement} Name cell content.
   */
  static #renderName(token, editing, handlers) {
    if (!editing) return ApiTokenCellsHelper.renderName(token);

    return (
      <ApiTokenRenameField
        value={editing.name}
        errors={editing.errors?.name ?? []}
        onChange={handlers.onRenameChange}
        onSave={() => handlers.onRenameSave(token)}
        onCancel={handlers.onRenameCancel}
      />
    );
  }

  /**
   * Render the actions cell: Save/Cancel while editing, Rename/Revoke otherwise.
   *
   * @param {object} token - Token item.
   * @param {(object|null)} editing - The rename state of this row.
   * @param {object} handlers - Row handlers.
   * @returns {React.ReactElement} Actions cell content.
   */
  static #renderActions(token, editing, handlers) {
    if (editing) {
      return (
        <>
          <button type="button" className="btn btn-primary btn-sm me-2" onClick={() => handlers.onRenameSave(token)}>
            {Translator.t('api_tokens_page.save')}
          </button>
          <button type="button" className="btn btn-outline-secondary btn-sm" onClick={handlers.onRenameCancel}>
            {Translator.t('api_tokens_page.cancel')}
          </button>
        </>
      );
    }

    return (
      <>
        <button type="button" className="btn btn-outline-secondary btn-sm me-2" onClick={() => handlers.onRenameStart(token)}>
          {Translator.t('api_tokens_page.rename')}
        </button>
        <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => handlers.onRevoke(token)}>
          {Translator.t('api_tokens_page.revoke')}
        </button>
      </>
    );
  }
}
