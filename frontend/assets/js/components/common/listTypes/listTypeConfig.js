import GenericClient from '../../../client/GenericClient.js';
import AccessStore from '../../../utils/access/store/AccessStore.js';
import Translator from '../../../i18n/Translator.js';
import Icons from '../../../utils/ui/Icons.js';
import TreasureListItem from './TreasureListItem.js';
import TreasureFilters from '../../resources/treasure/pages/elements/TreasureFilters.jsx';
import TreasureCardHelper from '../helpers/TreasureCardHelper.jsx';

/**
 * Fetch a page of a game's treasures, resolving the requester's edit permission first to
 * pick between the full catalog (`treasures/all.json`, editors only) and the player-facing,
 * hidden-filtered `treasures.json` — the same strategy `GameTreasuresController` previously
 * implemented directly.
 *
 * @param {string} gameSlug - Game slug.
 * @param {import('../../../utils/routing/HashRouteResolver.js').default} hashResolver -
 *   Resolver used to read active filter query params from the current hash.
 * @param {GenericClient} [client] - HTTP client override, mainly for tests.
 * @returns {Promise<{data: object[], pagination: object, canEdit: boolean}>} Resolves to the
 *   fetched treasures, pagination metadata, and the resolved edit permission.
 */
function fetchTreasures(gameSlug, hashResolver, client = new GenericClient()) {
  return AccessStore.ensureGamePermissions(gameSlug)
    .then((permissions) => Boolean(permissions.can_edit))
    .catch(() => false)
    .then((canEdit) => {
      const path = canEdit ? `/games/${gameSlug}/treasures/all.json` : `/games/${gameSlug}/treasures.json`;
      const filterParams = Object.fromEntries(hashResolver.getFilterParams());

      return client.fetchIndex(path, filterParams).then(({ data, pagination }) => ({
        data: Array.isArray(data) ? data : [],
        pagination,
        canEdit,
      }));
    });
}

/**
 * Build a treasure's action-bar props: the upload-button gate/handler (manage access limited
 * to treasures exclusive to the current game, matching the prior
 * `canEdit && treasure.game_slug === gameSlug` check) plus, for manageable treasures, a
 * secondary "Edit" overlay button navigating to the game-scoped edit form.
 *
 * @param {import('./TreasureListItem.js').default} item - Wrapped treasure list item.
 * @param {{gameSlug: string, canEdit: boolean, onUploadClick: Function}} context - Rendering
 *   context assembled by `ListPage`.
 * @returns {{canEdit: boolean, onClick: Function, secondaryButtons: object[]}} Action-bar
 *   props for `ActionsOverlay`.
 */
function buildActionBarProps(item, context) {
  const canManage = context.canEdit && item.data.game_slug === context.gameSlug;

  return {
    canEdit: canManage,
    onClick: () => context.onUploadClick(item.data),
    secondaryButtons: canManage ? [{
      label: Translator.t('game_treasures_page.edit'),
      icon: Icons.pencilFill,
      variant: 'outline-secondary',
      onClick: () => {
        window.location.hash = `#/games/${context.gameSlug}/treasures/${item.data.id}/edit`;
      },
    }] : [],
  };
}

/**
 * Build a treasure's info-bar items (the Hidden badge), delegating to
 * `TreasureCardHelper` so the badge shape isn't duplicated here.
 *
 * @param {import('./TreasureListItem.js').default} item - Wrapped treasure list item.
 * @returns {{key: string, label: React.ReactElement}[]} Info-bar item definitions.
 */
function buildInfoBarItems(item) {
  return TreasureCardHelper.buildInfoBarItems(item.data);
}

/**
 * Build a treasure's click-through href, to its global detail page.
 *
 * @param {import('./TreasureListItem.js').default} item - Wrapped treasure list item.
 * @returns {string} Hash path to the treasure detail page.
 */
function buildItemHref(item) {
  return `#/treasures/${item.data.id}`;
}

/**
 * Per-list-type configuration consumed by `ListPage`/`ListPageHelper`, keyed by list type
 * (`'pcs'`, `'npcs'`, `'treasures'`, extendable later to the character treasures/photos
 * variants), matching the existing `PHOTO_COMPONENTS` precedent in `ActionsOverlay.jsx`. Only
 * `treasures` is wired for now; `pcs`/`npcs` (and the character-scoped variants) are left for a
 * future migration issue once this pattern is validated on the treasures page. Each entry
 * holds:
 * - `fetchList(gameSlug, hashResolver, client?)` — fetches one page of list data.
 * - `wrapperClass` — the `BaseListItem` subclass normalizing each raw entry.
 * - `filtersComponent` — filter bar rendered above the grid, or `null`.
 * - `photoType` — `ActionsOverlay`'s `type` prop for this entity's photo/avatar.
 * - `buildActionBarProps(item, context)` / `buildInfoBarItems(item, context)` — delegate to
 *   the existing per-card helpers rather than re-implementing them.
 * - `showCaption` — whether caption text (display text + optional formatted value) appears
 *   under the photo.
 * - `buildItemHref(item, context)` — click-through URL builder.
 */
const listTypeConfig = {
  treasures: {
    fetchList: fetchTreasures,
    wrapperClass: TreasureListItem,
    filtersComponent: TreasureFilters,
    photoType: 'treasure',
    buildActionBarProps,
    buildInfoBarItems,
    showCaption: true,
    buildItemHref,
  },
};

export default listTypeConfig;
