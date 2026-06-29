import React from 'react';
import Translator from '../../../i18n/Translator.js';

/**
 * Rendering helper for the CharacterInfo element.
 */
export default class CharacterInfoHelper {
  /**
   * Render the character info panel.
   *
   * @param {string} name - Character name.
   * @param {string} [character_class] - Character class.
   * @param {number|null} [level] - Character level.
   * @param {string} [description] - Character description.
   * @returns {React.ReactElement} Character info element.
   */
  static render(name, character_class, level, description) {
    return (
      <div className="col-md-8">
        <h1>{name}</h1>
        {CharacterInfoHelper.#renderClassLevel(character_class, level)}
        {CharacterInfoHelper.#renderDescription(description)}
      </div>
    );
  }

  /**
   * Render the class and level line, or null if class is absent.
   *
   * @param {string} [character_class] - Character class.
   * @param {number|null} [level] - Character level.
   * @returns {React.ReactElement|null} Class/level paragraph or null.
   */
  static #renderClassLevel(character_class, level) {
    if (!character_class) return null;
    return (
      <p className="text-muted mb-1">
        <strong>{Translator.t('character_info.class_label')}</strong> {character_class}
        {level !== null && level !== undefined && (
          <span> &mdash; {Translator.t('character_info.level_label')} {level}</span>
        )}
      </p>
    );
  }

  /**
   * Render the description paragraph, or null if description is absent.
   *
   * @param {string} [description] - Character description.
   * @returns {React.ReactElement|null} Description paragraph or null.
   */
  static #renderDescription(description) {
    if (!description) return null;
    return <div className="mt-3 p-3 border rounded bg-light">{description}</div>;
  }
}
