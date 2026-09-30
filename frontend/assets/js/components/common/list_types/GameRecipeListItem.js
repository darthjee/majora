import BaseListItem from './BaseListItem.js';
import Translator from '../../../i18n/Translator.js';

/**
 * List-item wrapper for a `GameRecipe` entry (issue #1449). A recipe has no photo of its own, so
 * the photo comes from its output common item; the caption adds an "output × yield" line, and the
 * hidden flag mirrors `GameCommonItemListItem`.
 */
export default class GameRecipeListItem extends BaseListItem {
  /**
   * Photo URL of the recipe's output common item, or null when the output is masked (`null`)
   * or has no photo.
   *
   * @returns {string|null} Photo URL.
   */
  get photoUrl() {
    return this.data.output?.photo_path ?? null;
  }

  /**
   * The "output × yield" caption line, using the output's name or the translated
   * "unknown output" label when the output is masked.
   *
   * @returns {string} Formatted yield line.
   */
  get formattedValue() {
    const output = this.data.output?.name ?? Translator.t('game_recipes_page.unknown_output');

    return Translator.t('game_recipes_page.yield_format')
      .replace('{{output}}', output)
      .replace('{{yield}}', this.data.yield_quantity);
  }

  /**
   * Whether the recipe is hidden from players (only present in the `/all.json` variant).
   *
   * @returns {boolean} Hidden flag.
   */
  get hidden() {
    return Boolean(this.data.hidden);
  }
}
