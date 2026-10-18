import ApiTokensTableHelper from './helpers/ApiTokensTableHelper.jsx';

/**
 * Table of the owner's API tokens (issue #1605), with inline rename and per-row Rename/Revoke
 * actions (kept for expired tokens too).
 *
 * @param {object} props - Component props.
 * @param {Array<object>} props.tokens - Token items, in API order.
 * @param {({id: number, name: string, errors: object}|null)} props.renaming - The row being
 *   renamed, or `null`.
 * @param {{onRenameStart: Function, onRenameChange: Function, onRenameSave: Function,
 *   onRenameCancel: Function, onRevoke: Function}} props.handlers - Row handlers.
 * @returns {React.ReactElement} Rendered token table.
 */
export default function ApiTokensTable({ tokens, renaming, handlers }) {
  return ApiTokensTableHelper.render(tokens, renaming, handlers);
}
