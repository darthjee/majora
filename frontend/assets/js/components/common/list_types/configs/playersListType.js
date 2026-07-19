import React from 'react';
import GenericClient from '../../../../client/GenericClient.js';
import PlayerListItem from '../PlayerListItem.js';
import UserAvatarBadge from '../../badges/UserAvatarBadge.jsx';

/**
 * Fetch a page of a game's players (its roster: DM and players). Players have no `all.json`
 * variant, no permission split, and no filters — matching `docs/agents/access-control/player.md`
 * (the endpoint itself is already gated to the game's DM/players/staff/superuser server-side).
 *
 * @param {string} gameSlug - Game slug.
 * @param {import('../../../../utils/routing/HashRouteResolver.js').default} hashResolver -
 *   Unused for this list type, kept for a uniform `fetchList` signature across list types.
 * @param {GenericClient} [client] - HTTP client override, mainly for tests.
 * @returns {Promise<{data: object[], pagination: object, canEdit: boolean}>} Resolves to the
 *   fetched players and pagination metadata; `canEdit` is always `false`, since players have no
 *   per-item manage affordance on this list page.
 */
function fetchPlayers(gameSlug, hashResolver, client = new GenericClient()) {
  return client.fetchIndex(`/games/${gameSlug}/players.json`).then(({ data, pagination }) => ({
    data: Array.isArray(data) ? data : [],
    pagination,
    canEdit: false,
  }));
}

/**
 * Build a player's action-bar props: always non-manageable, since players have no upload/edit
 * affordance on this list page.
 *
 * @returns {{canEdit: boolean, secondaryButtons: object[]}} Action-bar props for `ActionsOverlay`.
 */
function buildReadOnlyActionBarProps() {
  return { canEdit: false, secondaryButtons: [] };
}

/**
 * Build a player's info-bar items: a single circular `UserAvatarBadge` for the linked `User`
 * (Gravatar + display-name tooltip), or none when the player has no linked `User` account
 * (a named participant with no login identity has no display name/photo to show).
 *
 * @param {import('../PlayerListItem.js').default} item - Wrapped player list item.
 * @returns {{key: string, label: React.ReactElement}[]} Info-bar item definitions.
 */
function buildPlayerInfoBarItems(item) {
  const { user } = item.data;

  if (!user) {
    return [];
  }

  return [{
    key: 'user-badge',
    label: React.createElement(UserAvatarBadge, {
      photoUrl: user.photo_url,
      displayName: user.display_name,
    }),
  }];
}

/**
 * Build a player's click-through href, linking to the player's own detail page (issue #695).
 *
 * @param {import('../PlayerListItem.js').default} item - Wrapped player list item.
 * @param {{gameSlug: string}} context - Rendering context, supplying the game slug.
 * @returns {string} Hash path to the player's detail page.
 */
function buildPlayerItemHref(item, context) {
  return `#/games/${context.gameSlug}/players/${item.data.id}`;
}

/**
 * `listTypeConfig` entry for the game-scoped players roster list (`'players'`).
 */
const playersListType = {
  fetchList: fetchPlayers,
  wrapperClass: PlayerListItem,
  filtersComponent: null,
  photoType: 'avatar',
  buildActionBarProps: buildReadOnlyActionBarProps,
  buildInfoBarItems: buildPlayerInfoBarItems,
  showCaption: true,
  buildItemHref: buildPlayerItemHref,
};

export default playersListType;
