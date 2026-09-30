import GenericClient from '../../../../../client/GenericClient.js';
import RequestStore from '../../../../../utils/requests/RequestStore.js';
import Translator from '../../../../../i18n/Translator.js';
import BasePageController from '../../../../common/base/controllers/BasePageController.js';
import Noop from '../../../../../utils/Noop.js';

/**
 * Controller for the PC/NPC recipe detail page (issue #1450), shared by `PcCharacterRecipe` and
 * `NpcCharacterRecipe` via the `characterKind` constructor argument — modeled on
 * `CharacterDocumentDetailController`, minus photos/pages.
 *
 * @description Loads the entry through `RequestStore.ensure({resource: 'characterRecipe',
 *   quantityType: 'single'})`, whose character-level resolver picks `full.json` (adding `hidden`)
 *   for CharacterEdit (PC) / GameEdit (NPC) callers. Any failure (including the `404` served for a
 *   hidden row, an unknown row, another character's row, or a hidden NPC) renders the
 *   `character_recipe_page.not_found` state. {@link toggleHidden} persists the hidden switch via
 *   `PATCH` with `{hidden}` only; `RequestStore.mutate` purges `characterRecipe` on success.
 */
export default class CharacterRecipeDetailController extends BasePageController {
  /**
   * Extract the game slug, character id, and character recipe id from a detail hash.
   *
   * @param {string} characterKind - Character kind (`'pcs'` or `'npcs'`), used as the URL segment.
   * @param {string} hash - Current hash.
   * @returns {object} Route params (`game_slug`, `character_id`, `id`).
   */
  static getParamsFromHash(characterKind, hash = '') {
    return BasePageController.extractParams(
      `/games/:game_slug/${characterKind}/:character_id/recipes/:id`,
      hash,
      ['game_slug', 'character_id', 'id'],
    );
  }

  /**
   * Create a character recipe detail controller.
   *
   * @param {string} characterKind - Character kind (`'pcs'` or `'npcs'`), used as the URL segment.
   * @param {Function} setRecipe - Recipe entry setter.
   * @param {Function} setLoading - Loading setter.
   * @param {Function} setError - Error setter.
   * @param {GenericClient} [client] - Client override, mainly for tests.
   */
  constructor(characterKind, setRecipe, setLoading, setError, client = new GenericClient()) {
    super();
    this.characterKind = characterKind;
    this.setRecipe = setRecipe;
    this.setLoading = setLoading;
    this.setError = setError;
    this.client = client;
  }

  /**
   * Build page loading effect.
   *
   * @returns {Function} Effect callback.
   */
  buildEffect() {
    return () => {
      let mounted = true;
      const safeSet = this.buildSafeSetter(() => mounted);
      const params = this.#params();

      if (!params.game_slug || !params.character_id || !params.id) {
        safeSet(this.setError, Translator.t('character_recipe_page.not_found'));
        safeSet(this.setLoading, false);
      } else {
        this.#loadRecipe(params, safeSet);
      }

      return () => {
        mounted = false;
      };
    };
  }

  /**
   * Persist a new `hidden` value for the entry (`PATCH` with `{hidden}` only), updating the
   * local entry once the server accepts it. A rejected/failed request leaves the entry as is.
   *
   * @param {object} recipe - Currently loaded entry.
   * @param {boolean} hidden - New `hidden` value.
   * @returns {Promise<void>} Resolves once the mutation settled.
   */
  toggleHidden(recipe, hidden) {
    return RequestStore.mutate({
      componentName: 'CharacterRecipeDetailController',
      resource: 'characterRecipe',
      method: 'PATCH',
      quantityType: 'single',
      params: this.#requestParams(this.#params()),
      body: { hidden },
    })
      .then((response) => {
        if (response.ok) {
          this.setRecipe({ ...recipe, hidden });
        }
      })
      .catch(Noop.noop);
  }

  #params() {
    return CharacterRecipeDetailController.getParamsFromHash(this.characterKind, this.client.currentHash());
  }

  #requestParams(params) {
    return {
      gameSlug: params.game_slug, kind: this.characterKind, id: params.character_id, characterRecipeId: params.id,
    };
  }

  #loadRecipe(params, safeSet) {
    return RequestStore.ensure({
      componentName: 'CharacterRecipeDetailController',
      resource: 'characterRecipe',
      quantityType: 'single',
      params: this.#requestParams(params),
    })
      .then(({ data }) => safeSet(this.setRecipe, data))
      .catch(() => safeSet(this.setError, Translator.t('character_recipe_page.not_found')))
      .finally(() => safeSet(this.setLoading, false));
  }
}
