import React from 'react';

/**
 * Rendering helper for the CharacterDescription element.
 */
export default class CharacterDescriptionHelper {
  /**
   * Render the description paragraph, or null if description is absent.
   *
   * @param {string} [description] - Character description.
   * @returns {React.ReactElement|null} Description paragraph or null.
   */
  static render(description) {
    if (!description) return null;

    return <div className="mt-3 p-3 border rounded bg-light text-pre-wrap">{description}</div>;
  }
}
