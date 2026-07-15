import React from 'react';
import Translator from '../../../../../../i18n/Translator.js';

/**
 * Rendering helper for the CharacterRole element.
 */
export default class CharacterRoleHelper {
  /**
   * Render the role line, or null if role is absent.
   *
   * @param {string} [role] - Character role.
   * @returns {React.ReactElement|null} Role paragraph or null.
   */
  static render(role) {
    if (!role) return null;

    return (
      <p className="text-muted mb-1">
        <strong>{Translator.t('character_info.role_label')}</strong> {role}
      </p>
    );
  }
}
