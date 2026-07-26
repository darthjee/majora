/**
 * Resolve a "private-with-public-fallback" field value: the private value when present
 * (not `null`/`undefined`), otherwise the public value. Shared by every caller that needs to
 * derive *display* state (e.g. the grayscale photo treatment, the allegiance border color) from
 * a character's slain/allegiance duality, regardless of whether that caller operates on a raw
 * character object (`CharacterAvatarHelper`, `CharacterPreviewCardHelper`) or a `BaseListItem`
 * subclass wrapping one (`NpcListItem`).
 *
 * @param {*} privateValue - The field's private value, or `null`/`undefined` when absent.
 * @param {*} publicValue - The field's public value, used as a fallback.
 * @returns {*} The resolved value.
 */
function resolvePrivateOrPublic(privateValue, publicValue) {
  return privateValue ?? publicValue;
}

/**
 * Resolve a character's slain state for display purposes, preferring `private_slain` and
 * falling back to `public_slain` when the private value is absent (e.g. for a viewer whose
 * payload only ever carries the public field).
 *
 * @param {object} character - Character-shaped data object.
 * @param {boolean} [character.private_slain] - The character's real slain state.
 * @param {boolean} [character.public_slain] - The character's publicly known slain state.
 * @returns {boolean|undefined} The resolved slain state.
 */
export function resolveCharacterSlain(character) {
  return resolvePrivateOrPublic(character.private_slain, character.public_slain);
}

/**
 * Resolve a character's allegiance for display purposes, preferring `private_allegiance` and
 * falling back to `public_allegiance` when the private value is absent (e.g. for a viewer whose
 * payload only ever carries the public field).
 *
 * @param {object} character - Character-shaped data object.
 * @param {string} [character.private_allegiance] - The character's real allegiance.
 * @param {string} [character.public_allegiance] - The character's publicly known allegiance.
 * @returns {string|undefined} The resolved allegiance.
 */
export function resolveCharacterAllegiance(character) {
  return resolvePrivateOrPublic(character.private_allegiance, character.public_allegiance);
}
