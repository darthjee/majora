import GenericClient from '../../../../client/GenericClient.js';
import AccessStore from '../../../../utils/access/store/AccessStore.js';
import allegianceBorderClass from '../../../../utils/ui/AllegianceBorder.js';
import fetchPermissionGatedIndex from '../fetchPermissionGatedIndex.js';
import { buildReadOnlyActionBarProps } from '../listTypeConfig.js';
import SlainSecondaryButtons from '../SlainSecondaryButtons.js';
import InfoBarRules from '../../misc/helpers/InfoBarRules.js';
import NpcFilters from '../../../resources/character/pages/elements/NpcFilters.jsx';
import PcListItem from '../PcListItem.js';
import NpcListItem from '../NpcListItem.js';

/**
 * Fetch a page of a game's PCs. PCs have no `all.json` variant (no hidden concept, no
 * permission split) — matching today's `GamePcsController`.
 *
 * @param {string} gameSlug - Game slug.
 * @param {import('../../../../utils/routing/HashRouteResolver.js').default} hashResolver -
 *   Unused for this list type, kept for a uniform `fetchList` signature across list types.
 * @param {GenericClient} [client] - HTTP client override, mainly for tests.
 * @returns {Promise<{data: object[], pagination: object, canEdit: boolean}>} Resolves to the
 *   fetched PCs and pagination metadata; `canEdit` is always `false`, since PCs have no
 *   per-item manage affordance on this list page.
 */
function fetchPcs(gameSlug, hashResolver, client = new GenericClient()) {
  return client.fetchIndex(`/games/${gameSlug}/pcs.json`).then(({ data, pagination }) => ({
    data: Array.isArray(data) ? data : [],
    pagination,
    canEdit: false,
  }));
}

/**
 * Fetch a page of a game's NPCs, resolving the requester's edit permission first to pick
 * between the full catalog (`npcs/all.json`, editors only) and the player-facing,
 * hidden-filtered `npcs.json` — the same strategy `GameNpcsController#loadNpcs` previously
 * implemented directly. The requester's `is_player` status (also resolved by
 * `GameNpcsController#loadNpcs`) is unrelated to which endpoint is fetched, so it is resolved
 * separately, page-level, and threaded through `ListPage`'s `context` prop instead.
 *
 * @param {string} gameSlug - Game slug.
 * @param {import('../../../../utils/routing/HashRouteResolver.js').default} hashResolver -
 *   Resolver used to read active filter query params from the current hash.
 * @param {GenericClient} [client] - HTTP client override, mainly for tests.
 * @returns {Promise<{data: object[], pagination: object, canEdit: boolean}>} Resolves to the
 *   fetched NPCs, pagination metadata, and the resolved edit permission.
 */
function fetchNpcs(gameSlug, hashResolver, client = new GenericClient()) {
  const filterParams = Object.fromEntries(hashResolver.getFilterParams());

  return fetchPermissionGatedIndex(
    AccessStore.ensureGamePermissions(gameSlug), `/games/${gameSlug}/npcs`, filterParams, client,
  );
}

/**
 * Build the NPC's secondary slain/revive button definitions: the DM's real and public toggle
 * pair when the current user may edit the game, a single player-facing toggle when the current
 * user is merely a player of the game, or none otherwise — mirroring
 * `CharacterCardHelper#buildSecondaryButtons`.
 *
 * @param {object} character - Raw NPC data object.
 * @param {{canEdit: boolean, isPlayer?: boolean, onSlainClick: Function,
 *   onPublicSlainClick: Function, onPlayerSlainClick?: Function}} context - Rendering context
 *   assembled by `ListPage`/`GameNpcs`.
 * @returns {{label: string, variant: string, icon: string, onClick: Function}[]} Secondary
 *   button definitions.
 */
function buildNpcSecondaryButtons(character, context) {
  if (context.canEdit) {
    return SlainSecondaryButtons.buildDmButtons(
      character,
      () => context.onSlainClick(character),
      () => context.onPublicSlainClick(character),
    );
  }

  if (context.isPlayer) {
    return [SlainSecondaryButtons.buildSlainButton(
      character.slain, () => context.onPlayerSlainClick(character),
    )];
  }

  return [];
}

/**
 * Build an NPC's action-bar props: the upload-button gate/handler (granted to editors and, per
 * `CharacterCardHelper`'s prior `canUploadPhoto` rule, to any player of the game too), the
 * grayscale/dimmed photo state (real-slain/hidden), and the secondary slain/revive button set.
 *
 * @param {import('../NpcListItem.js').default} item - Wrapped NPC list item.
 * @param {{canEdit: boolean, isPlayer?: boolean, onUploadClick: Function, onSlainClick: Function,
 *   onPublicSlainClick: Function, onPlayerSlainClick?: Function}} context - Rendering context
 *   assembled by `ListPage`/`GameNpcs`.
 * @returns {{canEdit: boolean, onClick: Function, grayscale: boolean, dimmed: boolean,
 *   secondaryButtons: object[]}} Action-bar props for `ActionsOverlay`.
 */
function buildNpcActionBarProps(item, context) {
  const character = item.data;

  return {
    canEdit: Boolean(context.canEdit) || Boolean(context.isPlayer),
    onClick: () => context.onUploadClick(character),
    grayscale: Boolean(character.slain),
    dimmed: Boolean(character.hidden),
    secondaryButtons: buildNpcSecondaryButtons(character, context),
  };
}

/**
 * Build an NPC's extra card class name, the allegiance-colored border `CharacterCardHelper`
 * previously rendered on the outer card div.
 *
 * @param {import('../NpcListItem.js').default} item - Wrapped NPC list item.
 * @returns {string} Bootstrap border classes for the NPC's allegiance.
 */
function buildNpcCardClassName(item) {
  return allegianceBorderClass(item.data.allegiance);
}

/**
 * Build a character's info-bar items (status/deception badges), delegating to `InfoBarRules` so
 * the badge shape isn't duplicated here.
 *
 * @param {import('../PcListItem.js').default|import('../NpcListItem.js').default} item -
 *   Wrapped character list item.
 * @returns {{key: string, label: React.ReactElement}[]} Info-bar item definitions.
 */
function buildCharacterInfoBarItems(item) {
  return InfoBarRules.build(item.data);
}

/**
 * Build a `buildItemHref(item, context)` function for a character list type, linking to the
 * character's own detail page.
 *
 * @param {string} characterKind - Character kind (`'pcs'` or `'npcs'`), used as the URL segment.
 * @returns {Function} A `buildItemHref(item, context)` function for this character kind.
 */
function buildCharacterItemHref(characterKind) {
  return function buildHref(item, context) {
    return `#/games/${context.gameSlug}/${characterKind}/${item.data.id}`;
  };
}

/**
 * `listTypeConfig` entries for the game-scoped PCs (`'pcs'`) and NPCs (`'npcs'`) lists.
 */
const characterListTypes = {
  pcs: {
    fetchList: fetchPcs,
    wrapperClass: PcListItem,
    filtersComponent: null,
    photoType: 'avatar',
    buildActionBarProps: buildReadOnlyActionBarProps,
    buildInfoBarItems: buildCharacterInfoBarItems,
    showCaption: true,
    buildItemHref: buildCharacterItemHref('pcs'),
    itemsPerRow: 4,
  },
  npcs: {
    fetchList: fetchNpcs,
    wrapperClass: NpcListItem,
    filtersComponent: NpcFilters,
    photoType: 'avatar',
    buildActionBarProps: buildNpcActionBarProps,
    buildInfoBarItems: buildCharacterInfoBarItems,
    buildCardClassName: buildNpcCardClassName,
    showCaption: true,
    buildItemHref: buildCharacterItemHref('npcs'),
    itemsPerRow: 4,
  },
};

export default characterListTypes;
