import { useEffect, useMemo, useState } from 'react';
import CharacterTreasuresHelper from '../helpers/CharacterTreasuresHelper.jsx';
import TreasureExchangeModal from '../elements/TreasureExchangeModal.jsx';
import mergeCharacterTreasureQuantity from '../../../../../utils/money/mergeCharacterTreasureQuantity.js';
import FacadeRefresh from '../../../../../utils/access/useFacadeRefresh.js';
import TreasureFilters from '../../../treasure/pages/elements/TreasureFilters.jsx';
import HashRouteResolver from '../../../../../utils/routing/HashRouteResolver.js';

/**
 * Applies the result of a successful treasure exchange: re-fetches the character (so its
 * money, and any other field, reflects a fresh server read instead of a local patch) and
 * merges the exchanged treasure's quantity into the currently loaded treasures list.
 *
 * @param {object} controller - The page's treasures controller instance.
 * @param {Function} setTreasures - Treasures list setter.
 * @param {{treasureId: number, treasureInfo: object, quantity: number}} payload - Exchange
 *   result payload from the modal's `onSuccess` handler.
 * @returns {void}
 */
export function applyExchangeSuccess(controller, setTreasures, { treasureId, treasureInfo, quantity }) {
  controller.refreshCharacter();
  setTreasures((prev) => mergeCharacterTreasureQuantity(prev, treasureId, treasureInfo, quantity));
}

/**
 * Builds the character context object passed to the treasure exchange modal,
 * threading through the game-scoped ids and the DM/admin `canEdit` flag (issue #632,
 * fixed to source from game-level permissions by issue #641) so the modal's Acquire
 * tab routes through the `all.json` endpoints — letting a DM browse and acquire
 * hidden treasures on behalf of the character — instead of always hitting the
 * player-facing, hidden-filtered ones. Sourced from `character.game_can_edit`
 * (game-level, DM/superuser only, via `AccessStore.ensureGamePermissions`) rather
 * than `character.can_edit` (character-level, also `true` for a PC's own owning
 * player), since only the former matches what the `all.json` endpoints actually
 * authorize.
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
 * @description Accepts a type-specific controller class, hash param extractor, and
 *   character kind as props, so NPC and PC treasures pages can share identical logic.
 * @param {object} props - Component props.
 * @param {Function} props.ControllerClass - Treasures controller class to instantiate, also
 *   used statically to build the filter-query hash via `ControllerClass.buildFilterQueryHash`.
 * @param {Function} props.getParamsFromHash - Hash-parsing function for this character type.
 * @param {string} props.characterKind - Character kind URL segment (`'pcs'` or `'npcs'`).
 * @param {boolean} props.isPc - Whether the character is a PC (vs. an NPC), passed through
 *   to the treasure exchange modal.
 * @returns {React.ReactElement} Character treasures page element.
 */
export default function CharacterTreasures({ ControllerClass, getParamsFromHash, characterKind, isPc }) {
  const [treasures, setTreasures] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, perPage: 10 });
  const [character, setCharacter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showExchangeModal, setShowExchangeModal] = useState(false);

  const controller = useMemo(
    () => new ControllerClass(setTreasures, setPagination, setLoading, setError, null, setCharacter),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(() => controller.buildEffect()(), [controller]);
  FacadeRefresh.useFacadeRefresh(controller);

  const currentHash = typeof window === 'undefined' ? '' : window.location.hash;
  const { game_slug: gameSlug, character_id: characterId } = getParamsFromHash(currentHash);
  const basePath = `#/games/${gameSlug}/${characterKind}/${characterId}/treasures`;
  const backHref = `#/games/${gameSlug}/${characterKind}/${characterId}`;
  const gameType = character?.game_type ?? 'dnd';
  const activeFilters = Object.fromEntries(new HashRouteResolver().getFilterParams());

  const handleExchangeSuccess = (payload) => applyExchangeSuccess(controller, setTreasures, payload);

  const handleFilterQuery = (filters) => {
    window.location.hash = ControllerClass.buildFilterQueryHash(basePath, filters);
    controller.buildEffect()();
  };

  const handleFilterClear = () => {
    window.location.hash = basePath;
    controller.buildEffect()();
  };

  if (loading) return CharacterTreasuresHelper.renderLoading();
  if (error) return CharacterTreasuresHelper.renderError(error);

  return (
    <>
      {CharacterTreasuresHelper.render(
        treasures, pagination, basePath, backHref, character?.can_edit,
        () => setShowExchangeModal(true), gameType, activeFilters,
        <TreasureFilters onQuery={handleFilterQuery} onClear={handleFilterClear} showGameType={false} />,
      )}
      <TreasureExchangeModal
        show={showExchangeModal}
        character={buildExchangeCharacter(characterId, gameSlug, isPc, character)}
        gameType={gameType}
        ownedTreasures={treasures}
        onClose={() => setShowExchangeModal(false)}
        onSuccess={handleExchangeSuccess}
      />
    </>
  );
}
