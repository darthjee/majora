import { useEffect, useMemo, useState } from 'react';
import CharacterRecipesHelper from '../helpers/CharacterRecipesHelper.jsx';
import CharacterContextController from '../controllers/CharacterContextController.js';
import ResourceExchangeModal from '../elements/ResourceExchangeModal.jsx';
import recipeExchangeTabs from '../elements/recipeExchangeTabs.js';
import BasePageController from '../../../../common/base/controllers/BasePageController.js';
import FacadeRefresh from '../../../../../utils/access/useFacadeRefresh.js';
import getCurrentHash from '../../../../../utils/routing/currentHash.js';

/**
 * Builds the character context object passed to the recipe exchange modal, mirroring
 * `CharacterDocuments.jsx`'s `buildDocumentExchangeCharacter`: `canEdit` (character-level —
 * routes the Remove tab through `recipes/remove/all.json`) and `gameCanEdit` (game-level — routes
 * the Acquire tab through `recipes/acquire/all.json`).
 *
 * @param {string|number} characterId - Character id.
 * @param {string} gameSlug - Game slug the character belongs to.
 * @param {boolean} isPc - Whether the character is a PC (vs. an NPC).
 * @param {object|null} character - Currently loaded character context, or `null` while loading.
 * @returns {object} Character context for {@link ResourceExchangeModal}.
 */
export function buildRecipeExchangeCharacter(characterId, gameSlug, isPc, character) {
  return {
    id: characterId,
    game_slug: gameSlug,
    is_pc: isPc,
    canEdit: character?.can_edit,
    gameCanEdit: character?.game_can_edit,
  };
}

/**
 * Resolves whether the page's "Exchange" button should render, sourced from the
 * permission-aware `can_exchange_recipe` flag (issue #1450) — mirroring
 * `CharacterTreasures.jsx`'s `resolveExchangeButtonCanEdit` / `can_exchange_treasure` and
 * `CharacterDocuments.jsx`'s `resolveDocumentExchangeButton` / `can_exchange_document`.
 *
 * @param {object|null} character - Currently loaded character context, or `null` while loading.
 * @returns {boolean} Whether the "Exchange" button should render.
 */
export function resolveRecipeExchangeButton(character) {
  return Boolean(character?.can_exchange_recipe);
}

/**
 * Shared PC/NPC recipes index page component (issue #1450), mirroring
 * `shared/CharacterDocuments.jsx`: the page-level character context (via
 * `CharacterContextController`) drives the "Exchange" trigger and the recipe exchange modal,
 * while the grid itself renders through the shared `ListPage` (`pc-recipes`/`npc-recipes`).
 *
 * @param {object} props - Component props.
 * @param {string} props.characterKind - Character kind URL segment (`'pcs'` or `'npcs'`).
 * @param {string} props.listType - `listTypeConfig` key for this character kind
 *   (`'pc-recipes'`/`'npc-recipes'`).
 * @param {boolean} props.isPc - Whether the character is a PC (vs. an NPC), passed through to
 *   the recipe exchange modal.
 * @returns {React.ReactElement} Character recipes page element.
 */
export default function CharacterRecipes({ characterKind, listType, isPc }) {
  const [character, setCharacter] = useState(null);
  const [showExchangeModal, setShowExchangeModal] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);
  const [itemsCount, setItemsCount] = useState(null);

  const currentHash = getCurrentHash();
  const { game_slug: gameSlug, character_id: characterId } = BasePageController.extractParams(
    `/games/:game_slug/${characterKind}/:character_id/recipes`, currentHash, ['game_slug', 'character_id'],
  );

  const contextController = useMemo(
    () => new CharacterContextController(characterKind, setCharacter, null, null, null, 'recipes'),
    [characterKind],
  );

  useEffect(() => contextController.buildEffect()(), [contextController]);
  FacadeRefresh.useFacadeRefresh(contextController);

  const handleExchangeSuccess = () => {
    contextController.refreshCharacter();
    setRefreshToken((token) => token + 1);
  };

  return (
    <>
      {CharacterRecipesHelper.render(
        {
          characterKind,
          listType,
          gameSlug,
          characterId,
          refreshToken,
          itemsCount,
          canExchange: resolveRecipeExchangeButton(character),
        },
        {
          onExchange: () => setShowExchangeModal(true),
          onItemsChange: (items) => setItemsCount(items.length),
        },
      )}
      <ResourceExchangeModal
        show={showExchangeModal}
        character={buildRecipeExchangeCharacter(characterId, gameSlug, isPc, character)}
        tabs={recipeExchangeTabs}
        defaultTab="acquire"
        onClose={() => setShowExchangeModal(false)}
        onSuccess={handleExchangeSuccess}
      />
    </>
  );
}
