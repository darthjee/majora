import React from 'react';
import CardAvatar from '../../elements/CardAvatar.jsx';
import EditButton from '../../elements/EditButton.jsx';
import PageActions from '../../elements/PageActions.jsx';
import CharacterInfo from '../../elements/CharacterInfo.jsx';
import CharacterPhotos from '../../elements/CharacterPhotos.jsx';
import ErrorAlert from '../../elements/ErrorAlert.jsx';
import LinkList from '../../elements/LinkList.jsx';
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
   * @param {string|null} [character.profile_photo_path] - Optional profile photo path, takes precedence over character.avatar_url.
   * @param {string|null} [character.avatar_url] - Optional avatar URL, used as a fallback.
   * @param {string} [character.role] - Character role.
   * @param {string} [character.public_description] - Character public description.
   * @param {string} [character.private_description] - Character private description (DM notes).
   * @param {object[]} [character.photos] - Additional photos array.
   * @param {object[]} [character.links] - External link objects with text and url.
   * @param {boolean} [character.can_edit] - Whether the current user may edit this character.
   * @param {boolean} [character.is_pc] - Whether the character is a PC (vs. an NPC), used
   *   to build the correct edit link segment.
   * @param {string} [character.game_slug] - Slug of the game the character belongs to.
   * @param {number|string} [character.id] - Character id.
   * @param {string} backHref - Hash path to the character's index page.
   * @returns {React.ReactElement} Character detail element.
   */
  static render(character, backHref) {
    const segment = character.is_pc ? 'pcs' : 'npcs';

    return (
      <div className="container mt-4">
        <PageActions backHref={backHref}>
          {character.can_edit && (
            <EditButton href={`#/games/${character.game_slug}/${segment}/${character.id}/edit`}>
              {Translator.t('character_page.edit')}
            </EditButton>
          )}
        </PageActions>
        <div className="row">
          <div className="col-md-4">
            <CardAvatar url={character.profile_photo_path || character.avatar_url} alt={character.name} />
          </div>
          <CharacterInfo
            name={character.name}
            role={character.role}
            description={character.public_description}
          />
        </div>
        {CharacterHelper.#renderPrivateDescription(character.private_description)}
        <CharacterPhotos photos={character.photos} alt={character.name} />
        <LinkList links={character.links} />
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
   * Render the DM notes section when private_description is non-empty.
   *
   * @param {string} [privateDescription] - Private description text.
   * @returns {React.ReactElement|null} DM notes section, or null.
   */
  static #renderPrivateDescription(privateDescription) {
    if (!privateDescription) return null;

    return (
      <div className="mt-4">
        <h5>{Translator.t('character_full_page.private_description_label')}</h5>
        <div className="p-3 border rounded bg-light">{privateDescription}</div>
      </div>
    );
  }

}
