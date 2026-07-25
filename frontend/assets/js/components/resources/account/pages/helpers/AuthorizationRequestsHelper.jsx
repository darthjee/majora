import Badge from '../../../../common/badges/Badge.jsx';
import LoadingMessage from '../../../../common/misc/LoadingMessage.jsx';
import PageActions from '../../../../common/list_page/PageActions.jsx';
import Pagination from '../../../../common/pagination/Pagination.jsx';
import Table from '../../../../common/misc/Table.jsx';
import Translator from '../../../../../i18n/Translator.js';
import AuthorizationRequestStatusBadges from '../../../../common/list_types/AuthorizationRequestStatusBadges.js';
import DenyAuthorizationRequestModal from '../elements/DenyAuthorizationRequestModal.jsx';
import AuthorizeAuthorizationRequestModal from '../elements/AuthorizeAuthorizationRequestModal.jsx';

/**
 * Rendering helper for the authorization requests listing page.
 */
export default class AuthorizationRequestsHelper {
  /**
   * Render the authorization requests list with pagination and per-row
   * deny/authorize actions (shown only for `open` requests), plus the two
   * confirm modals.
   *
   * @param {object[]} requests - Authorization request rows (`uuid`, `created_at`,
   *   `status`, `ip`, `browser`).
   * @param {object} pagination - Pagination metadata.
   * @param {number} pagination.page - Current page.
   * @param {number} pagination.pages - Total pages.
   * @param {number} pagination.perPage - Items per page.
   * @param {{denyTarget: (object|null), authorizeTarget: (object|null), password: string,
   *   authorizeError: boolean}} state - Confirm modal state.
   * @param {{onOpenDeny: Function, onOpenAuthorize: Function, onCloseModals: Function,
   *   onDenyConfirm: Function, onAuthorizeConfirm: Function, onPasswordChange: Function}} handlers -
   *   Event handlers.
   * @returns {React.ReactElement} Authorization requests list with pagination and modals.
   */
  static render(requests, pagination, state, handlers) {
    const columns = [
      { key: 'uuid', label: Translator.t('authorization_requests_page.column_uuid') },
      { key: 'created_at', label: Translator.t('authorization_requests_page.column_created_at') },
      { key: 'status', label: Translator.t('authorization_requests_page.column_status') },
    ];
    const rows = requests.map((request) => AuthorizationRequestsHelper.#buildRow(request));

    return (
      <div className="container mt-4">
        <PageActions backHref="#/my_account" />
        <h1>{Translator.t('authorization_requests_page.title')}</h1>
        <Table
          columns={columns}
          rows={rows}
          renderActions={(row) => AuthorizationRequestsHelper.#renderRowActions(row, handlers)}
        />
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.pages}
          perPage={pagination.perPage}
          basePath="#/account/authorization_requests"
        />
        <DenyAuthorizationRequestModal
          show={Boolean(state.denyTarget)}
          request={state.denyTarget}
          onConfirm={handlers.onDenyConfirm}
          onCancel={handlers.onCloseModals}
        />
        <AuthorizeAuthorizationRequestModal
          show={Boolean(state.authorizeTarget)}
          request={state.authorizeTarget}
          password={state.password}
          error={state.authorizeError}
          onPasswordChange={handlers.onPasswordChange}
          onConfirm={handlers.onAuthorizeConfirm}
          onCancel={handlers.onCloseModals}
        />
      </div>
    );
  }

  /**
   * Render the loading state.
   *
   * @returns {React.ReactElement} Loading message.
   */
  static renderLoading() {
    return <LoadingMessage message={Translator.t('authorization_requests_page.loading')} />;
  }

  /**
   * Build a display row for the table, keeping the raw request object under
   * `request` (used by `#renderRowActions` and the confirm modals) alongside
   * the formatted/badge-rendered display values used by the table columns.
   *
   * @param {object} request - Raw authorization request row.
   * @returns {object} Display row for the table.
   */
  static #buildRow(request) {
    const badge = AuthorizationRequestStatusBadges.build(request.status);

    return {
      uuid: request.uuid,
      created_at: new Date(request.created_at).toLocaleString(Translator.getLanguage()),
      status: <Badge variant={badge.variant} text={badge.text} />,
      request,
    };
  }

  /**
   * Render the per-row deny/authorize actions, shown only while the request
   * is still `open`.
   *
   * @param {object} row - Display row built by `#buildRow`.
   * @param {{onOpenDeny: Function, onOpenAuthorize: Function}} handlers - Event handlers.
   * @returns {React.ReactElement|null} Row actions, or null when the request isn't `open`.
   */
  static #renderRowActions(row, handlers) {
    if (row.request.status !== 'open') {
      return null;
    }

    return (
      <>
        <button
          type="button"
          className="btn btn-secondary btn-sm me-2"
          onClick={() => handlers.onOpenDeny(row.request)}
        >
          {Translator.t('authorization_requests_page.dismiss')}
        </button>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={() => handlers.onOpenAuthorize(row.request)}
        >
          {Translator.t('authorization_requests_page.authorize')}
        </button>
      </>
    );
  }
}
