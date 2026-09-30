import React from 'react';
import ErrorAlert from '../../../../common/misc/ErrorAlert.jsx';
import LoadingMessage from '../../../../common/misc/LoadingMessage.jsx';
import ShowPageLayout from '../../../../common/show_page/ShowPageLayout.jsx';
import CharacterRecipeBackLink from '../elements/show/CharacterRecipeBackLink.jsx';
import Translator from '../../../../../i18n/Translator.js';

/**
 * Rendering helper for the PC/NPC recipe detail page (issue #1450), mirroring
 * `CharacterDocumentDetailHelper`: renders through the `character_recipe` `showTypeConfig` entry
 * (`characterRecipeShowType.js`), `Show` mode only.
 */
export default class CharacterRecipeDetailHelper {
  /**
   * Render the recipe detail view through `ShowPageLayout`.
   *
   * @param {object} recipe - `CharacterRecipe` detail data (`name`, `output`, `yield_quantity`,
   *   `crafting_time`, `crafting_cost`, `description`, `ingredients`, `checks`,
   *   `game_recipe_id`, plus `hidden` on the `full.json` variant).
   * @param {object} route - Route context.
   * @param {string} route.backHref - Hash path to the character's recipes list.
   * @param {string} route.gameSlug - Game slug, merged into the context as `game_slug`.
   * @param {object} handlers - Event handlers.
   * @param {Function} handlers.onHiddenChange - Called with the new `hidden` boolean.
   * @returns {React.ReactElement} Recipe detail element.
   */
  static render(recipe, route, handlers) {
    return (
      <ShowPageLayout
        type="character_recipe"
        mode="show"
        context={{
          ...recipe,
          backHref: route.backHref,
          game_slug: route.gameSlug,
          handlers,
        }}
      />
    );
  }

  /**
   * Render the loading state.
   *
   * @returns {React.ReactElement} Loading message.
   */
  static renderLoading() {
    return <LoadingMessage message={Translator.t('character_recipe_page.loading')} />;
  }

  /**
   * Render the error (not-found) state, keeping the back link to the recipes list.
   *
   * @param {string} error - Error message.
   * @param {string} backHref - Hash path to the character's recipes list.
   * @returns {React.ReactElement} Error alert with a back link.
   */
  static renderError(error, backHref) {
    return (
      <div className="container mt-4">
        <CharacterRecipeBackLink backHref={backHref} />
        <ErrorAlert error={error} />
      </div>
    );
  }
}
