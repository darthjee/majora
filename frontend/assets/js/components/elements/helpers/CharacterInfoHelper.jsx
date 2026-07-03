import React from 'react';
import Translator from '../../../i18n/Translator.js';

/**
 * Rendering helper for the CharacterInfo element.
 */
export default class CharacterInfoHelper {
  /**
   * Render the character role/description panel.
   *
   * @param {string} [role] - Character role.
   * @param {string} [description] - Character description.
   * @returns {React.ReactElement} Character info element.
   */
  static render(role, description) {
    return (
      <div className="col-md-8">
        {CharacterInfoHelper.#renderRole(role)}
        {CharacterInfoHelper.#renderDescription(description)}
      </div>
    );
  }

  /**
   * Render the role line, or null if role is absent.
   *
   * @param {string} [role] - Character role.
   * @returns {React.ReactElement|null} Role paragraph or null.
   */
  static #renderRole(role) {
    if (!role) return null;
    return (
      <p className="text-muted mb-1">
        <strong>{Translator.t('character_info.role_label')}</strong> {role}
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
