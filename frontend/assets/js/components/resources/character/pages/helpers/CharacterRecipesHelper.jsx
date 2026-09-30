import React from 'react';
import PageActions from '../../../../common/list_page/PageActions.jsx';
import UploadButton from '../../../../common/buttons/UploadButton.jsx';
import ListPage from '../../../../common/list_page/ListPage.jsx';
import Translator from '../../../../../i18n/Translator.js';

/**
 * Rendering helper shared by the PcCharacterRecipes and NpcCharacterRecipes pages (issue #1450),
 * mirroring `CharacterDocumentsHelper` plus `GameRecipesHelper`'s empty-state message.
 */
export default class CharacterRecipesHelper {
  /**
   * Render the recipes page: header (back button, "Exchange" action gated on
   * `state.canExchange`, heading), the shared `ListPage` grid (type `pc-recipes`/`npc-recipes`)
   * and the empty-state message.
   *
   * @param {object} state - Page state.
   * @param {string} state.characterKind - Character kind (`'pcs'` or `'npcs'`), the URL segment.
   * @param {string} state.listType - `listTypeConfig` key (`'pc-recipes'`/`'npc-recipes'`).
   * @param {string} state.gameSlug - Game slug the character belongs to.
   * @param {string|number} state.characterId - Character id.
   * @param {number} [state.refreshToken] - Opaque value bumped to re-trigger the list fetch.
   * @param {number|null} [state.itemsCount] - Number of recipes on the loaded page, or `null`
   *   while not loaded yet.
   * @param {boolean} [state.canExchange] - Whether the "Exchange" button renders
   *   (`can_exchange_recipe`).
   * @param {object} [handlers] - Page event handlers.
   * @param {Function} [handlers.onExchange] - Called when the "Exchange" button is clicked.
   * @param {Function} [handlers.onItemsChange] - Called with the freshly fetched raw recipes.
   * @returns {React.ReactElement} Rendered recipes page.
   */
  static render(state, handlers = {}) {
    const {
      characterKind, listType, gameSlug, characterId, refreshToken = 0,
    } = state;
    const backHref = `#/games/${gameSlug}/${characterKind}/${characterId}`;

    return (
      <>
        <div className="container mt-4">
          <PageActions backHref={backHref}>
            {CharacterRecipesHelper.#renderExchangeButton(state.canExchange, handlers.onExchange)}
          </PageActions>
          <h1 className="mb-4">{Translator.t('character_recipes_page.title')}</h1>
        </div>
        <ListPage
          type={listType}
          gameSlug={gameSlug}
          basePath={`${backHref}/recipes`}
          loadingMessage={Translator.t('character_recipes_page.loading')}
          context={{ characterId }}
          refreshToken={refreshToken}
          handlers={{ onItemsChange: handlers.onItemsChange }}
        />
        {CharacterRecipesHelper.#renderEmpty(state.itemsCount)}
      </>
    );
  }

  static #renderExchangeButton(canExchange, onExchange) {
    if (!canExchange) {
      return null;
    }

    return (
      <UploadButton onClick={onExchange}>
        {Translator.t('character_recipes_page.exchange_button')}
      </UploadButton>
    );
  }

  static #renderEmpty(itemsCount) {
    if (itemsCount !== 0) {
      return null;
    }

    return (
      <div className="container">
        <p className="text-muted" data-testid="character-recipes-empty">
          {Translator.t('character_recipes_page.empty')}
        </p>
      </div>
    );
  }
}
