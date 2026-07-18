import { useEffect, useMemo, useState } from 'react';
import CharacterTreasuresHelper from '../helpers/CharacterTreasuresHelper.jsx';
import TreasureExchangeModal from '../elements/TreasureExchangeModal.jsx';
import CharacterContextController from '../controllers/CharacterContextController.js';
import BasePageController from '../../../../common/base/controllers/BasePageController.js';
import mergeCharacterTreasureQuantity from '../../../../../utils/money/mergeCharacterTreasureQuantity.js';
import FacadeRefresh from '../../../../../utils/access/useFacadeRefresh.js';
import HashRouteResolver from '../../../../../utils/routing/HashRouteResolver.js';

/**
 * Build the hash URL for applying treasure filters, resetting pagination to page 1.
 *
 * @param {string} basePath - Base hash path (e.g. `#/games/demo/pcs/2/treasures`).
 * @param {{min_value?: string, max_value?: string, name?: string}} filters - Filters to apply,
 *   as built by `TreasureFiltersController#buildQuery` (blank fields already omitted).
 * @returns {string} Hash including the reset page and the active filters.
 */
function buildFilterQueryHash(basePath, filters) {
  const params = new URLSearchParams({ page: '1', ...filters });
  return `${basePath}?${params.toString()}`;
}

/**
 * Merge a successful exchange's result into the currently loaded owned-treasures snapshot kept
 * for the exchange modal's "already owned" cross-reference, delegating to
 * `mergeCharacterTreasureQuantity` so the merge logic isn't duplicated here. Exposed
 * separately from the component so it can be exercised directly, without needing to mount the
 * whole page.
 *
 * @param {object[]} prev - Currently loaded owned-treasure entries.
 * @param {{treasureId: number, treasureInfo: object, quantity: number}} payload - Exchange
 *   result payload from the modal's `onSuccess` handler.
 * @returns {object[]} The updated owned-treasures snapshot.
 */
export function mergeOwnedTreasures(prev, payload) {
  return mergeCharacterTreasureQuantity(prev, payload.treasureId, payload.treasureInfo, payload.quantity);
}

/**
 * Builds the character context object passed to the treasure exchange modal, threading through
 * the game-scoped ids and the DM/admin `canEdit` flag (issue #632, fixed to source from
 * game-level permissions by issue #641) so the modal's Acquire tab routes through the
 * `all.json` endpoints — letting a DM browse and acquire hidden treasures on behalf of the
 * character — instead of always hitting the player-facing, hidden-filtered ones. Sourced from
 * `character.game_can_edit` (game-level, DM/superuser only, via
 * `AccessStore.ensureGamePermissions`) rather than `character.can_edit` (character-level, also
 * `true` for a PC's own owning player), since only the former matches what the `all.json`
 * endpoints actually authorize.
 *
 * @param {string|number} characterId - Character id.
 * @param {string} gameSlug - Game slug the character belongs to.
 * @param {boolean} isPc - Whether the character is a PC (vs. an NPC).
 * @param {object|null} character - Currently loaded character context, or `null` while loading.
 * @returns {object} Character context for {@link TreasureExchangeModal}.
 */
export function buildExchangeCharacter(characterId, gameSlug, isPc, character) {
  return {
    id: characterId,
    game_slug: gameSlug,
    is_pc: isPc,
    money: character?.money ?? 0,
    canEdit: character?.game_can_edit,
  };
}

/**
 * Shared character treasures index page component.
 *
 * @description The treasures grid itself renders through the shared `ListPage`/`listTypeConfig`
 *   abstraction (`pc-treasures`/`npc-treasures`, threaded via `listType`); this component only
 *   owns the page-level character context (needed by the "Add treasure" button and the
 *   exchange modal, via `CharacterContextController`) and the exchange modal's own state,
 *   mirroring how `GameTreasuresHelper` keeps its own upload-modal state alongside `ListPage`.
 * @param {object} props - Component props.
 * @param {string} props.characterKind - Character kind URL segment (`'pcs'` or `'npcs'`).
 * @param {string} props.listType - `listTypeConfig` key for this character kind
 *   (`'pc-treasures'`/`'npc-treasures'`).
 * @param {boolean} props.isPc - Whether the character is a PC (vs. an NPC), passed through
 *   to the treasure exchange modal.
 * @returns {React.ReactElement} Character treasures page element.
 */
export default function CharacterTreasures({ characterKind, listType, isPc }) {
  const [character, setCharacter] = useState(null);
  const [ownedTreasures, setOwnedTreasures] = useState([]);
  const [showExchangeModal, setShowExchangeModal] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);

  const currentHash = typeof window === 'undefined' ? '' : window.location.hash;
  const { game_slug: gameSlug, character_id: characterId } = BasePageController.extractParams(
    `/games/:game_slug/${characterKind}/:character_id/treasures`, currentHash, ['game_slug', 'character_id'],
  );
  const basePath = `#/games/${gameSlug}/${characterKind}/${characterId}/treasures`;
  const backHref = `#/games/${gameSlug}/${characterKind}/${characterId}`;
  const gameType = character?.game_type ?? 'dnd';
  const activeFilters = Object.fromEntries(new HashRouteResolver().getFilterParams());

  const controller = useMemo(
    () => new CharacterContextController(characterKind, setCharacter),
    [characterKind],
  );

  useEffect(() => controller.buildEffect()(), [controller]);
  FacadeRefresh.useFacadeRefresh(controller);

  const refresh = () => setRefreshToken((token) => token + 1);

  const handleExchangeSuccess = (payload) => {
    controller.refreshCharacter();
    setOwnedTreasures((prev) => mergeOwnedTreasures(prev, payload));
    refresh();
  };

  const handleFilterQuery = (filters) => {
    window.location.hash = buildFilterQueryHash(basePath, filters);
    refresh();
  };

  const handleFilterClear = () => {
    window.location.hash = basePath;
    refresh();
  };

  return (
    <>
      {CharacterTreasuresHelper.render(
        {
          gameSlug, listType, basePath, backHref, canEdit: character?.can_edit, refreshToken, activeFilters,
        },
        {
          onAddTreasure: () => setShowExchangeModal(true),
          onFilterQuery: handleFilterQuery,
          onFilterClear: handleFilterClear,
          onItemsChange: setOwnedTreasures,
        },
      )}
      <TreasureExchangeModal
        show={showExchangeModal}
        character={buildExchangeCharacter(characterId, gameSlug, isPc, character)}
        gameType={gameType}
        ownedTreasures={ownedTreasures}
        onClose={() => setShowExchangeModal(false)}
        onSuccess={handleExchangeSuccess}
      />
    </>
  );
}
