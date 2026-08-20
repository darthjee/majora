import { useEffect, useMemo, useState } from 'react';
import CharacterTreasuresHelper from '../helpers/CharacterTreasuresHelper.jsx';
import ResourceExchangeModal from '../elements/ResourceExchangeModal.jsx';
import treasureExchangeTabs from '../elements/treasureExchangeTabs.js';
import CharacterContextController from '../controllers/CharacterContextController.js';
import BasePageController from '../../../../common/base/controllers/BasePageController.js';
import mergeCharacterTreasureQuantity from '../../../../../utils/money/mergeCharacterTreasureQuantity.js';
import FacadeRefresh from '../../../../../utils/access/useFacadeRefresh.js';
import HashRouteResolver from '../../../../../utils/routing/HashRouteResolver.js';
import getCurrentHash from '../../../../../utils/routing/currentHash.js';
import useFilterHandlers from './hooks/useFilterHandlers.js';

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
 * game-level permissions by issue #641) so the modal's Buy tab routes through the
 * `all.json` endpoints — letting a DM browse and buy hidden treasures on behalf of the
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
 * Resolves whether the page's "Exchange Treasure" button should render, sourced from the
 * permission-aware `can_exchange_treasure` field (mirroring `can_edit_money`) — `true` for a
 * superuser, the game's DM, (for PCs) the character's own owning player, or any Staff account
 * (issue #712) — rather than the unrelated character-level `can_edit` field, which also covers
 * edits unrelated to treasure exchange. Exposed separately from the component, mirroring
 * {@link buildExchangeCharacter}, so this gating can be exercised directly without mounting the
 * whole page.
 *
 * @param {object|null} character - Currently loaded character context, or `null` while loading.
 * @returns {boolean|undefined} Whether the "Exchange Treasure" button should render.
 */
export function resolveExchangeButtonCanEdit(character) {
  return character?.can_exchange_treasure;
}

/**
 * Private hook bundling the page-level character context load state (`character`/
 * `refreshToken`) together with the `CharacterContextController` instance, its effect/facade-
 * refresh wiring, and the grid `refresh` trigger.
 *
 * @param {string} characterKind - Character kind URL segment (`'pcs'` or `'npcs'`).
 * @returns {{character: object|null, refreshToken: number, controller: object, refresh:
 *   Function}} Load state, controller instance, and grid-refresh trigger.
 */
function useCharacterTreasuresLoad(characterKind) {
  const [character, setCharacter] = useState(null);
  const [refreshToken, setRefreshToken] = useState(0);

  const controller = useMemo(
    () => new CharacterContextController(characterKind, setCharacter),
    [characterKind],
  );

  useEffect(() => controller.buildEffect()(), [controller]);
  FacadeRefresh.useFacadeRefresh(controller);

  const refresh = () => setRefreshToken((token) => token + 1);

  return {
    character, refreshToken, controller, refresh,
  };
}

/**
 * Builds the handlers object passed into `CharacterTreasuresHelper.render`.
 *
 * @param {object} params - Handler-building params.
 * @param {Function} params.setShowExchangeModal - `useTreasureExchangeModal()`'s
 *   `setShowExchangeModal` setter.
 * @param {Function} params.onFilterQuery - `useFilterHandlers()`'s `onFilterQuery`.
 * @param {Function} params.onFilterClear - `useFilterHandlers()`'s `onFilterClear`.
 * @param {Function} params.setOwnedTreasures - `useTreasureExchangeModal()`'s
 *   `setOwnedTreasures` setter.
 * @returns {object} Handlers object for `CharacterTreasuresHelper.render`.
 */
function buildCharacterTreasuresHandlers({
  setShowExchangeModal, onFilterQuery, onFilterClear, setOwnedTreasures,
}) {
  return {
    onAddTreasure: () => setShowExchangeModal(true),
    onFilterQuery,
    onFilterClear,
    onItemsChange: setOwnedTreasures,
  };
}

/**
 * Private hook bundling the treasure exchange modal's `showExchangeModal`/`ownedTreasures`
 * state together with its success handler, which refreshes the page-level character context,
 * merges the exchanged quantity into the owned-treasures snapshot, and re-triggers the grid
 * refresh.
 *
 * @param {object} controller - `CharacterContextController` instance, exposing
 *   `refreshCharacter`.
 * @param {Function} refresh - Called to re-trigger the treasures grid's data fetch.
 * @returns {{ownedTreasures: object[], setOwnedTreasures: Function, showExchangeModal: boolean,
 *   setShowExchangeModal: Function, handleExchangeSuccess: Function}} Exchange modal state and
 *   handlers.
 */
function useTreasureExchangeModal(controller, refresh) {
  const [ownedTreasures, setOwnedTreasures] = useState([]);
  const [showExchangeModal, setShowExchangeModal] = useState(false);

  const handleExchangeSuccess = (payload) => {
    controller.refreshCharacter();
    setOwnedTreasures((prev) => mergeOwnedTreasures(prev, payload));
    refresh();
  };

  return {
    ownedTreasures, setOwnedTreasures, showExchangeModal, setShowExchangeModal, handleExchangeSuccess,
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
  const {
    character, refreshToken, controller, refresh,
  } = useCharacterTreasuresLoad(characterKind);

  const currentHash = getCurrentHash();
  const { game_slug: gameSlug, character_id: characterId } = BasePageController.extractParams(
    `/games/:game_slug/${characterKind}/:character_id/treasures`, currentHash, ['game_slug', 'character_id'],
  );
  const basePath = `#/games/${gameSlug}/${characterKind}/${characterId}/treasures`;
  const backHref = `#/games/${gameSlug}/${characterKind}/${characterId}`;
  const gameType = character?.game_type ?? 'dnd';
  const activeFilters = Object.fromEntries(new HashRouteResolver().getFilterParams());

  const {
    ownedTreasures, setOwnedTreasures, showExchangeModal, setShowExchangeModal, handleExchangeSuccess,
  } = useTreasureExchangeModal(controller, refresh);

  const { onFilterQuery, onFilterClear } = useFilterHandlers(basePath, refresh);
  const handlers = buildCharacterTreasuresHandlers({
    setShowExchangeModal, onFilterQuery, onFilterClear, setOwnedTreasures,
  });

  return (
    <>
      {CharacterTreasuresHelper.render(
        {
          gameSlug,
          listType,
          basePath,
          backHref,
          canEdit: resolveExchangeButtonCanEdit(character),
          refreshToken,
          activeFilters,
        },
        handlers,
      )}
      <ResourceExchangeModal
        show={showExchangeModal}
        character={buildExchangeCharacter(characterId, gameSlug, isPc, character)}
        tabs={treasureExchangeTabs}
        defaultTab="buy"
        gameType={gameType}
        ownedTreasures={ownedTreasures}
        onClose={() => setShowExchangeModal(false)}
        onSuccess={handleExchangeSuccess}
      />
    </>
  );
}
