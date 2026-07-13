import React from 'react';
import ActionsOverlay from '../../../../elements/ActionsOverlay.jsx';
import EditButton from '../../../../elements/EditButton.jsx';
import PageActions from '../../../../elements/PageActions.jsx';
import ConditionalComponent from '../../../../elements/ConditionalComponent.jsx';
import CharacterInfo from '../elements/CharacterInfo.jsx';
import CharacterMoney from '../elements/CharacterMoney.jsx';
import ErrorAlert from '../../../../elements/ErrorAlert.jsx';
import LinkList from '../../../../elements/LinkList.jsx';
import LoadingMessage from '../../../../elements/LoadingMessage.jsx';
import CharacterTreasuresPreview from '../elements/CharacterTreasuresPreview.jsx';
import Translator from '../../../../../i18n/Translator.js';
import allegianceBorderClass from '../../../../../utils/AllegianceBorder.js';
import SlainSecondaryButtons from '../../../../elements/helpers/SlainSecondaryButtons.js';
import InfoBarRules from '../../../../elements/helpers/InfoBarRules.js';

/**
 * Rendering helper for the Character detail page.
 */
export default class CharacterHelper {
  /**
   * Render the character detail view.
   *
   * @param {object} character - Character data object.
   * @param {string} character.name - Character name.
   * @param {string|null} [character.profile_photo_path] - Optional profile photo path.
   * @param {string} [character.role] - Character role.
   * @param {string} [character.public_description] - Character public description.
   * @param {string} [character.private_description] - Character private description (DM notes).
   * @param {object[]} [character.links] - External link objects with text and url.
   * @param {number} [character.money] - Total money, expressed in copper pieces.
   * @param {boolean} [character.can_edit] - Whether the current user may edit this character.
   * @param {boolean} [character.is_player] - Whether the current user is a player of the
   *   game (but not necessarily this character's editor), gates the single player-facing
   *   slain/revive button.
   * @param {boolean} [character.is_pc] - Whether the character is a PC (vs. an NPC), used
   *   to build the correct edit link segment and to gate the slain/revive button.
   * @param {boolean} [character.slain] - Whether the character is (really) slain for a DM,
   *   or its public-facing slain alias for a non-editor; drives grayscale rendering and the
   *   real/player slain/revive button label.
   * @param {boolean} [character.public_slain] - Whether the character is publicly slain,
   *   drives the public slain/revive button label (DM-facing data only).
   * @param {string} [character.allegiance] - Allegiance value (`'ally'`, `'enemy'`,
   *   `'neutral'`, or missing), drives the picture border color for NPCs only.
   * @param {string} [character.game_slug] - Slug of the game the character belongs to.
   * @param {number|string} [character.id] - Character id.
   * @param {object[]} [character.treasures] - Preview list of the character's treasures
   *   (`id`, `treasure_id`, `name`, `quantity`, `value`, `photo_path`), rendered as a card
   *   grid with a link to the full list page.
   * @param {string} backHref - Hash path to the character's index page.
   * @param {{onOpenUploadModal: Function, onOpenSlainModal: Function,
   *   onOpenPublicSlainModal: Function, onOpenPlayerSlainModal: Function}} [handlers] - Event handlers.
   * @returns {React.ReactElement} Character detail element.
   */
  static render(character, backHref, handlers = {}) {
    const segment = character.is_pc ? 'pcs' : 'npcs';

    return (
      <div className="container mt-4">
        <PageActions backHref={backHref}>
          <ConditionalComponent render={character.can_edit}>
            <EditButton href={`#/games/${character.game_slug}/${segment}/${character.id}/edit`}>
              {Translator.t('character_page.edit')}
            </EditButton>
          </ConditionalComponent>
        </PageActions>
        <div className="row">
          <div className="col-md-4">
            {CharacterHelper.#renderPicture(character, handlers)}
            <h1>{character.name}</h1>
            <LinkList links={character.links} />
            <CharacterMoney money={character.money} />
          </div>
          <CharacterInfo
            role={character.role}
            description={character.public_description}
          />
        </div>
        {CharacterHelper.#renderPrivateDescription(character.private_description)}
        <CharacterTreasuresPreview
          treasures={character.treasures ?? []}
          title={Translator.t('character_page.treasures_title')}
          seeAllHref={`#/games/${character.game_slug}/${segment}/${character.id}/treasures`}
        />
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
   * Render the character's picture, wrapped in an allegiance-colored border
   * for NPCs. PCs render the plain picture, unaffected by allegiance.
   *
   * @param {object} character - Character data object.
   * @param {string|null} [character.profile_photo_path] - Optional profile photo path.
   * @param {string} character.name - Character name.
   * @param {boolean} [character.can_edit] - Whether the current user may edit this character.
   * @param {boolean} [character.is_player] - Whether the current user is a player of the game,
   *   grants NPC upload access even without edit rights (never widens `can_edit` itself, so
   *   it does not affect the DM edit button or the slain/revive button set).
   * @param {boolean} [character.slain] - Whether the character is (really) slain.
   * @param {boolean} [character.public_slain] - Whether the character is publicly slain.
   * @param {boolean} [character.is_pc] - Whether the character is a PC.
   * @param {string} [character.allegiance] - Allegiance value driving the border color.
   * @param {{onOpenUploadModal: Function}} handlers - Event handlers.
   * @returns {React.ReactElement} Picture element, optionally wrapped in a border.
   */
  static #renderPicture(character, handlers) {
    const picture = (
      <ActionsOverlay
        type="avatar"
        url={character.profile_photo_path}
        alt={character.name}
        canEdit={character.can_edit || (!character.is_pc && character.is_player)}
        onClick={handlers.onOpenUploadModal}
        grayscale={character.slain}
        secondaryButtons={CharacterHelper.#buildSecondaryButtons(character, handlers)}
        infoBarItems={InfoBarRules.build(character)}
      />
    );

    if (character.is_pc) {
      return picture;
    }

    return <div className={allegianceBorderClass(character.allegiance)}>{picture}</div>;
  }

  /**
   * Build the secondary slain/revive button definitions for an NPC's picture
   * overlay: the DM's real and public toggle pair when the current user may
   * edit the character, or a single player-facing toggle when the current
   * user is merely a player of the game. PCs, and NPCs the current user has
   * no access to toggle, get no buttons.
   *
   * @param {object} character - Character data object.
   * @param {boolean} [character.is_pc] - Whether the character is a PC.
   * @param {boolean} [character.can_edit] - Whether the current user may edit this character.
   * @param {boolean} [character.is_player] - Whether the current user is a player of the game.
   * @param {boolean} [character.slain] - Whether the character is currently (really) slain
   *   for a DM, or its public-facing slain alias for a non-editor.
   * @param {boolean} [character.public_slain] - Whether the character is currently publicly
   *   slain (DM-facing data only).
   * @param {{onOpenSlainModal: Function, onOpenPublicSlainModal: Function,
   *   onOpenPlayerSlainModal: Function}} handlers - Event handlers.
   * @returns {{label: string, variant: string, icon: string, onClick: Function}[]} Secondary
   *   button definitions, empty when not applicable.
   */
  static #buildSecondaryButtons(character, handlers) {
    if (character.is_pc) {
      return [];
    }

    if (character.can_edit) {
      return CharacterHelper.#buildDmSecondaryButtons(character, handlers);
    }

    if (character.is_player) {
      return CharacterHelper.#buildPlayerSecondaryButtons(character, handlers);
    }

    return [];
  }

  /**
   * Build the DM's real and public slain/revive secondary button definitions.
   *
   * @param {object} character - Character data object.
   * @param {boolean} [character.slain] - Whether the character is currently (really) slain.
   * @param {boolean} [character.public_slain] - Whether the character is currently publicly slain.
   * @param {{onOpenSlainModal: Function, onOpenPublicSlainModal: Function}} handlers - Event handlers.
   * @returns {{label: string, variant: string, icon: string, onClick: Function}[]} Secondary
   *   button definitions.
   */
  static #buildDmSecondaryButtons(character, handlers) {
    return SlainSecondaryButtons.buildDmButtons(
      character, handlers.onOpenSlainModal, handlers.onOpenPublicSlainModal,
    );
  }

  /**
   * Build the single player-facing slain/revive secondary button definition,
   * reusing the DM's real-slain button shape (`Icons.heart`/`Icons.skullFill`)
   * as an intentional icon reuse — players only ever toggle `public_slain`,
   * which is already the value aliased onto `character.slain` for non-editors.
   *
   * @param {object} character - Character data object.
   * @param {boolean} [character.slain] - The character's public-facing slain alias.
   * @param {{onOpenPlayerSlainModal: Function}} handlers - Event handlers.
   * @returns {{label: string, variant: string, icon: string, onClick: Function}[]} Secondary
   *   button definitions.
   */
  static #buildPlayerSecondaryButtons(character, handlers) {
    return [
      SlainSecondaryButtons.buildSlainButton(character.slain, handlers.onOpenPlayerSlainModal),
    ];
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
        <div className="p-3 border rounded bg-light text-pre-wrap">{privateDescription}</div>
      </div>
    );
  }

}
