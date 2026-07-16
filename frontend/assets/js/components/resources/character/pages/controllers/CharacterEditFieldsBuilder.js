/**
 * Pure field-shaping helpers shared by {@link BaseCharacterEditController}: seeding the
 * edit form from a loaded character, and building the two request payload shapes a
 * submit can send (full dm/admin editor vs. reduced player-only NPC editor).
 */
export default class CharacterEditFieldsBuilder {
  /**
   * Shape the form-seed fields object from a loaded character. A player-only editor's
   * loaded character only ever carries the plain-detail fields (no `full.json`
   * dual-load), so `public_allegiance`/`public_slain` fall back to the plain-detail
   * `allegiance`/`slain` keys, which the backend already aliases from the very same
   * public fields for a non-editor. `hidden` is only ever present on a full (dm/admin)
   * editor's `full.json` load, so it naturally defaults to `false` for a player-only editor.
   *
   * @param {object} character - Loaded character.
   * @returns {object} Seed fields for the edit form.
   */
  static fieldsFromCharacter(character) {
    return {
      name: character.name ?? '',
      role: character.role ?? '',
      public_description: character.public_description ?? '',
      private_description: character.private_description ?? '',
      money: String(character.money ?? 0),
      allegiance: character.allegiance ?? 'neutral',
      public_allegiance: CharacterEditFieldsBuilder.#fallback(
        character.public_allegiance, character.allegiance, 'neutral',
      ),
      public_slain: CharacterEditFieldsBuilder.#fallback(character.public_slain, character.slain, false),
      hidden: character.hidden ?? false,
      links: character.links ?? [],
    };
  }

  /**
   * Build the full fields payload sent by a full (dm/admin) editor to `full.json`.
   *
   * @param {object} formValues - Raw form field values.
   * @param {string} routeSegment - URL segment for this character type ('npcs' or 'pcs').
   * @returns {object} Fields payload for {@link BaseCharacterEditController#handleSubmit}.
   */
  static fullEditorFields(formValues, routeSegment) {
    const fields = {
      name: formValues.name,
      role: formValues.role,
      public_description: formValues.description,
      private_description: formValues.privateDescription,
      money: parseInt(formValues.money, 10),
      links: CharacterEditFieldsBuilder.linksPayload(formValues.links),
    };

    if (routeSegment === 'npcs') {
      fields.allegiance = formValues.allegiance;
      fields.public_allegiance = formValues.publicAllegiance;
      fields.public_slain = formValues.publicSlain;
      fields.hidden = formValues.hidden;
    }

    return fields;
  }

  /**
   * Build the reduced fields payload sent by a player-only NPC editor to the
   * narrower, player-writable NPC endpoint.
   *
   * @param {object} formValues - Raw form field values.
   * @returns {object} Fields payload for {@link BaseCharacterEditController#handleSubmit}.
   */
  static playerFields(formValues) {
    return {
      name: formValues.name,
      role: formValues.role,
      public_description: formValues.description,
      allegiance: formValues.publicAllegiance,
      links: CharacterEditFieldsBuilder.linksPayload(formValues.links),
      slain: formValues.publicSlain,
    };
  }

  /**
   * Maps the edit page's local links state to the wire shape expected by the character
   * update/create endpoints: blank `text` defaults to the link's `url`, `id` is only
   * included for persisted links, and `delete` reflects whether the link was marked
   * for deletion in the modal.
   *
   * @param {object[]} links - Local links state (as edited via LinksEditModal).
   * @returns {object[]} Links payload ready to send to the backend.
   */
  static linksPayload(links = []) {
    return links.map((link) => {
      const payload = {
        text: link.text?.trim() ? link.text : link.url,
        url: link.url,
        link_type: link.link_type ?? '',
        delete: Boolean(link.delete),
      };

      if (link.id) {
        payload.id = link.id;
      }

      return payload;
    });
  }

  /**
   * Resolve the first non-nullish value, falling back through an alternate value and
   * finally a default.
   *
   * @param {*} value - Preferred value.
   * @param {*} altValue - Fallback value, used when `value` is nullish.
   * @param {*} defaultValue - Final fallback, used when both are nullish.
   * @returns {*} The first non-nullish value.
   */
  static #fallback(value, altValue, defaultValue) {
    return value ?? altValue ?? defaultValue;
  }
}
