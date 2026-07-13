import React from 'react';
import MoneyModelRegistry from '../../../../../../utils/money/MoneyModelRegistry.js';
import '../../../../../../utils/money/DndMoneyModel.js';
import Translator from '../../../../../../i18n/Translator.js';

const ABBREVIATION_KEYS = {
  cp: 'money.cp_abbreviation',
  sp: 'money.sp_abbreviation',
  gp: 'money.gp_abbreviation',
  pp: 'money.pp_abbreviation',
};

/**
 * Rendering helper for the CharacterMoney element.
 */
export default class CharacterMoneyHelper {
  /**
   * Render the character's money as a cascading coin denomination
   * breakdown line. Renders null when money is 0 (no denomination entries).
   *
   * @param {number} money - Total money, expressed in copper pieces.
   * @returns {React.ReactElement|null} Money breakdown paragraph, or null.
   */
  static render(money) {
    const model = MoneyModelRegistry.resolve('dnd');
    const entries = model.transform(money, { context: 'character' });

    if (entries.length === 0) return null;

    return (
      <p className="character-money">
        {entries.map((entry) => CharacterMoneyHelper.#formatEntry(entry)).join(' | ')}
      </p>
    );
  }

  /**
   * Format a single coin denomination entry into its display string.
   *
   * @param {{key: string, quantity: number}} entry - Denomination entry.
   * @returns {string} Formatted entry (e.g. `20 CP` or `100 GP in gems`).
   */
  static #formatEntry(entry) {
    if (entry.key === 'gems') {
      return `${entry.quantity} ${Translator.t('money.gp_in_gems')}`;
    }

    return `${entry.quantity} ${Translator.t(ABBREVIATION_KEYS[entry.key])}`;
  }
}
