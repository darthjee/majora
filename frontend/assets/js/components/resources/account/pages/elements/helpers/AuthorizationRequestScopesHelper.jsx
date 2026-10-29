import ApiTokenCellsHelper from '../../../../../common/api_tokens/ApiTokenCellsHelper.jsx';
import Translator from '../../../../../../i18n/Translator.js';

/**
 * The scope whose request shows the visitor-data warning.
 *
 * @type {string}
 */
const STATISTICS_SCOPE = 'statistics:read';

/**
 * Renders the requested permissions of an authorization request (issue #1700).
 */
export default class AuthorizationRequestScopesHelper {
  /**
   * Render the "Requested permissions" list and, when `statistics:read` is requested, the
   * visitor-data warning.
   *
   * @param {Array<{group: string, families: Array<{family: string, read: boolean,
   *   write: boolean}>}>} groups - The requested scopes grouped by `ApiTokenScopes.groupScopes`.
   * @param {Array<string>} scopes - The raw requested scope strings.
   * @returns {React.ReactElement} Rendered requested permissions.
   */
  static render(groups, scopes) {
    const families = groups.flatMap(({ families: list }) => list);

    return (
      <div className="mb-3" data-testid="authorization-request-scopes">
        <span className="fw-semibold d-block">{Translator.t('authorization_requests_page.scopes_label')}</span>
        <ul className="mb-2">
          {families.map((family) => <li key={family.family}>{ApiTokenCellsHelper.scopeText(family)}</li>)}
        </ul>
        {AuthorizationRequestScopesHelper.#renderWarning(scopes)}
      </div>
    );
  }

  /**
   * Render the visitor-data warning when `statistics:read` is requested.
   *
   * @param {Array<string>} scopes - The raw requested scope strings.
   * @returns {React.ReactElement|null} The warning alert, or `null`.
   */
  static #renderWarning(scopes) {
    if (!scopes.includes(STATISTICS_SCOPE)) {
      return null;
    }

    return (
      <div className="alert alert-warning mb-0" role="alert">
        {Translator.t('authorization_requests_page.statistics_warning')}
      </div>
    );
  }
}
