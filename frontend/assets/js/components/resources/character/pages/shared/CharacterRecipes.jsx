import { useEffect, useMemo, useState } from 'react';
import CharacterRecipesHelper from '../helpers/CharacterRecipesHelper.jsx';
import CharacterContextController from '../controllers/CharacterContextController.js';
import BasePageController from '../../../../common/base/controllers/BasePageController.js';
import FacadeRefresh from '../../../../../utils/access/useFacadeRefresh.js';
import getCurrentHash from '../../../../../utils/routing/currentHash.js';

/**
 * Resolves whether the page's "Exchange" button should render, sourced from the
 * permission-aware `can_exchange_recipe` flag (issue #1450) — mirroring
 * `CharacterTreasures.jsx`'s `resolveExchangeButtonCanEdit` / `can_exchange_treasure`, and
 * unlike the Documents page, which does not gate its button.
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
 * `CharacterContextController`) drives the "Exchange" trigger, while the grid itself renders
 * through the shared `ListPage` (`pc-recipes`/`npc-recipes`).
 *
 * @param {object} props - Component props.
 * @param {string} props.characterKind - Character kind URL segment (`'pcs'` or `'npcs'`).
 * @param {string} props.listType - `listTypeConfig` key for this character kind
 *   (`'pc-recipes'`/`'npc-recipes'`).
 * @param {boolean} props.isPc - Whether the character is a PC (vs. an NPC).
 * @returns {React.ReactElement} Character recipes page element.
 */
export default function CharacterRecipes({ characterKind, listType }) {
  const [character, setCharacter] = useState(null);
  const [refreshToken] = useState(0);
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

  return CharacterRecipesHelper.render(
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
      onItemsChange: (items) => setItemsCount(items.length),
    },
  );
}
