import ApiTokenScopes from '../../../../common/api_tokens/ApiTokenScopes.js';
import AuthorizationRequestScopesHelper from './helpers/AuthorizationRequestScopesHelper.jsx';

/**
 * Lists the scopes a device asks for on the authorization request approval modal (issue #1700).
 *
 * @description Only scopes known to the UI catalogue are listed, by their translated labels;
 *   unknown scopes are dropped. Renders nothing for a plain login request (no `scopes`, an empty
 *   list, or only unknown scopes).
 * @param {object} props - Component props.
 * @param {Array<string>} [props.scopes] - The requested scope strings, e.g. `['npcs:read']`.
 * @returns {React.ReactElement|null} The requested permissions list, or `null` when there is none.
 */
export default function AuthorizationRequestScopes({ scopes = [] }) {
  const groups = ApiTokenScopes.groupScopes(scopes);

  if (groups.length === 0) {
    return null;
  }

  return AuthorizationRequestScopesHelper.render(groups, scopes);
}
