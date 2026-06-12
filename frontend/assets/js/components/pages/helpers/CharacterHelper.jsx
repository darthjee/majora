import React from 'react';
import CardAvatar from '../../elements/CardAvatar.jsx';
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
   * @returns {React.ReactElement} Character detail element.
   */
  static render(character) {
    return (
      <div className="container mt-4">
        <div className="row">
          <div className="col-md-4">
            <CardAvatar url={character.avatar_url} alt={character.name} />
          </div>
          <div className="col-md-8">
            <h1>{character.name}</h1>
            {character.character_class && (
              <p className="text-muted mb-1">
                <strong>Class:</strong> {character.character_class}
                {character.level !== null && character.level !== undefined && <span> &mdash; Level {character.level}</span>}
              </p>
            )}
            {character.description && (
              <p className="mt-3">{character.description}</p>
            )}
          </div>
        </div>
        {character.photos && character.photos.length > 0 && (
          <div className="row mt-4">
            {character.photos.map((photo) => (
              <div key={photo.id} className="col-sm-6 col-md-4 mb-3">
                <img src={photo.url} className="img-fluid rounded" alt={character.name} />
              </div>
            ))}
          </div>
        )}
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
