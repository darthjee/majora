import React from 'react';
import BackButton from '../../elements/BackButton.jsx';
import CardAvatar from '../../elements/CardAvatar.jsx';
import CharacterInfo from '../../elements/CharacterInfo.jsx';
import CharacterPhotos from '../../elements/CharacterPhotos.jsx';
import ErrorAlert from '../../elements/ErrorAlert.jsx';
import LoadingMessage from '../../elements/LoadingMessage.jsx';
import Translator from '../../../i18n/Translator.js';

/**
 * Rendering helper for the Character detail page.
 */
export default class CharacterHelper {
  /**
   * Render the character detail view.
   *
   * @param {object} character - Character data object.
   * @param {string} character.name - Character name.
   * @param {string|null} [character.avatar_url] - Optional avatar URL.
   * @param {string} [character.character_class] - Character class.
   * @param {number|null} [character.level] - Character level.
   * @param {string} [character.public_description] - Character public description.
   * @param {object[]} [character.photos] - Additional photos array.
   * @param {boolean} [character.can_edit] - Whether the current user may edit this character.
   * @param {boolean} [character.is_pc] - Whether the character is a PC (vs. an NPC), used
   *   to build the correct edit link segment.
   * @param {string} [character.game_slug] - Slug of the game the character belongs to.
   * @param {number|string} [character.id] - Character id.
   * @param {string} backHref - Hash path to the character's index page.
   * @returns {React.ReactElement} Character detail element.
   */
  static render(character, backHref) {
    return (
      <div className="container mt-4">
        <BackButton href={backHref} />
        {CharacterHelper.#renderEditButton(character)}
        <div className="row">
          <div className="col-md-4">
            <CardAvatar url={character.avatar_url} alt={character.name} />
          </div>
          <CharacterInfo
            name={character.name}
            character_class={character.character_class}
            level={character.level}
            description={character.public_description}
          />
        </div>
        <CharacterPhotos photos={character.photos} alt={character.name} />
      </div>
    );
  }

  /**
   * Render the loading state.
   *
   * @returns {React.ReactElement} Loading message.
   */
  static renderLoading() {
    return <LoadingMessage message={Translator.t('character_page.loading')} />;
  }

  /**
   * Render the error state.
   *
   * @param {string} error - Error message.
   * @returns {React.ReactElement} Error alert.
   */
  static renderError(error) {
    return <ErrorAlert error={error} />;
  }

  /**
   * Render the edit button when the current user can edit the character.
   *
   * @param {object} character - Character data object.
   * @returns {React.ReactElement|null} Edit button element, or null.
   */
  static #renderEditButton(character) {
    if (!character.can_edit) {
      return null;
    }

    const segment = character.is_pc ? 'pcs' : 'npcs';

    return (
      <a
        className="btn btn-secondary mt-2"
        href={`#/games/${character.game_slug}/${segment}/${character.id}/edit`}
      >
        {Translator.t('character_page.edit')}
      </a>
    );
  }
}
