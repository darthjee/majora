import React from 'react';
import BackButton from '../../elements/BackButton.jsx';
import CardAvatar from '../../elements/CardAvatar.jsx';
import CharacterInfo from '../../elements/CharacterInfo.jsx';
import CharacterPhotos from '../../elements/CharacterPhotos.jsx';
import ErrorAlert from '../../elements/ErrorAlert.jsx';
import LoadingMessage from '../../elements/LoadingMessage.jsx';

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
   * @param {string} [character.description] - Character description.
   * @param {object[]} [character.photos] - Additional photos array.
   * @param {string} backHref - Hash path to the character's index page.
   * @returns {React.ReactElement} Character detail element.
   */
  static render(character, backHref) {
    return (
      <div className="container mt-4">
        <BackButton href={backHref} />
        <div className="row">
          <div className="col-md-4">
            <CardAvatar url={character.avatar_url} alt={character.name} />
          </div>
          <CharacterInfo
            name={character.name}
            character_class={character.character_class}
            level={character.level}
            description={character.description}
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
    return <LoadingMessage message="Loading character..." />;
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
}
