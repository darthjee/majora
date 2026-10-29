import React from 'react';
import Badge from '../badges/Badge.jsx';
import ApiTokenStatusBadges from '../list_types/ApiTokenStatusBadges.js';
import ApiTokenScopes from './ApiTokenScopes.js';
import InlineTooltip from './InlineTooltip.jsx';
import Translator from '../../../i18n/Translator.js';

/**
 * Render the translated label of a family's actions (`read`, `write` or `read/write`).
 *
 * @param {{read: boolean, write: boolean}} family - The family's present actions.
 * @returns {string} The translated action label.
 */
const actionLabel = ({ read, write }) => {
  if (read && write) return Translator.t('api_tokens_page.scope_read_write');
  if (write) return Translator.t('api_tokens_page.scope_write');
  return Translator.t('api_tokens_page.scope_read');
};

/**
 * Static render helpers for the cells of one scoped API token row (issue #1605).
 *
 * @description Shared by the owner token page and the staff token panel (#1606), so both lists
 *   display a token the same way. Each method returns the cell content, not the `<td>`.
 */
export default class ApiTokenCellsHelper {
  /**
   * Render the token name.
   *
   * @param {{name: string}} token - Token item.
   * @returns {React.ReactElement} Name element.
   */
  static renderName(token) {
    return <span className="fw-semibold">{token.name}</span>;
  }

  /**
   * Render the token prefix as `mjr_<prefix>…` in monospace.
   *
   * @param {{prefix: string}} token - Token item.
   * @returns {React.ReactElement} Prefix element.
   */
  static renderPrefix(token) {
    return <code>{`mjr_${token.prefix}…`}</code>;
  }

  /**
   * Build the translated label of one scope family and its actions, e.g. "NPCs: read/write".
   *
   * @description Only catalogue labels are used, never raw scope strings; shared by the token
   *   badges and the authorization request approval modal.
   * @param {{family: string, read: boolean, write: boolean}} family - A grouped family, as
   *   returned by `ApiTokenScopes.groupScopes`.
   * @returns {string} The translated family and action label.
   */
  static scopeText(family) {
    return `${Translator.t(`api_tokens_page.family_${family.family}`)}: ${actionLabel(family)}`;
  }

  /**
   * Render one badge per scope family, in group order, e.g. "NPCs: read/write".
   *
   * @param {{scopes: Array<string>}} token - Token item.
   * @returns {React.ReactElement} Scope badges element.
   */
  static renderScopes(token) {
    const families = ApiTokenScopes.groupScopes(token.scopes).flatMap(({ families: list }) => list);

    return (
      <span className="d-inline-flex flex-wrap gap-1">
        {families.map((family) => (
          <Badge
            key={family.family}
            variant="info"
            text={ApiTokenCellsHelper.scopeText(family)}
          />
        ))}
      </span>
    );
  }

  /**
   * Render the token's games as chips, or an "All games" badge with a tooltip when the token
   * is not restricted to any game.
   *
   * @param {{games: Array<{slug: string, name: string}>}} token - Token item.
   * @returns {React.ReactElement} Games element.
   */
  static renderGames(token) {
    if (token.games.length === 0) {
      return (
        <InlineTooltip content={Translator.t('api_tokens_page.all_games_tooltip')}>
          <Badge variant="warning" text={Translator.t('api_tokens_page.all_games')} />
        </InlineTooltip>
      );
    }

    return (
      <span className="d-inline-flex flex-wrap gap-1">
        {token.games.map((game) => <Badge key={game.slug} text={game.name} />)}
      </span>
    );
  }

  /**
   * Render the expiry date, or "Never", with the full date and time in a tooltip.
   *
   * @param {{expires_at: (string|null)}} token - Token item.
   * @returns {React.ReactElement|string} Expiry element.
   */
  static renderExpires(token) {
    if (!token.expires_at) return Translator.t('api_tokens_page.never');

    const date = new Date(token.expires_at);
    const language = Translator.getLanguage();

    return (
      <InlineTooltip content={date.toLocaleString(language)}>
        {date.toLocaleDateString(language)}
      </InlineTooltip>
    );
  }

  /**
   * Render the last-used date and time, or "Never used".
   *
   * @param {{last_used_at: (string|null)}} token - Token item.
   * @returns {string} Last-used text.
   */
  static renderLastUsed(token) {
    if (!token.last_used_at) return Translator.t('api_tokens_page.never_used');

    return new Date(token.last_used_at).toLocaleString(Translator.getLanguage());
  }

  /**
   * Render the creation date and time.
   *
   * @param {{created_at: string}} token - Token item.
   * @returns {string} Creation text.
   */
  static renderCreated(token) {
    return new Date(token.created_at).toLocaleString(Translator.getLanguage());
  }

  /**
   * Render the status badge, from the API's own `status`.
   *
   * @param {{status: string}} token - Token item.
   * @returns {React.ReactElement} Status badge.
   */
  static renderStatus(token) {
    const badge = ApiTokenStatusBadges.build(token);

    return <Badge variant={badge.variant} text={badge.text} />;
  }
}
