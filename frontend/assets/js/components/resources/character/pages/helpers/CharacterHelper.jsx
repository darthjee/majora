import EditButton from '../../../../common/buttons/EditButton.jsx';
import ConditionalComponent from '../../../../common/misc/ConditionalComponent.jsx';
import ErrorAlert from '../../../../common/misc/ErrorAlert.jsx';
import LoadingMessage from '../../../../common/misc/LoadingMessage.jsx';
import ShowPageLayout from '../../../../common/show_page/ShowPageLayout.jsx';
import Translator from '../../../../../i18n/Translator.js';

/**
 * Rendering helper for the Character detail page, shared by PCs and NPCs (picking the
 * `showTypeConfig` type from `character.is_pc`), matching the pre-migration behavior where a
 * single `CharacterHelper` was already shared by both character kinds.
 */
export default class CharacterHelper {
  /**
   * Render the character detail view.
   *
   * @description The treasures/items/documents preview sections are no longer threaded through
   *   as `character` fields — `pcShowType.js`/`npcShowType.js`'s `right` slot now declares
   *   `buildShortListSlot('treasure'|'item'|'document')` (issue #856), each rendering a
   *   self-fetching `ShortList` element.
   * @param {object} character - Character data object.
   * @param {string} character.name - Character name.
   * @param {string|null} [character.profile_photo_path] - Optional profile photo path.
   * @param {string} [character.role] - Character role.
   * @param {string} [character.public_description] - Character public description.
   * @param {string} [character.private_description] - Character private description (DM notes).
   * @param {object[]} [character.links] - External link objects with text and url.
   * @param {number} [character.money] - Total money, expressed in the currency's lowest
   *   denomination.
   * @param {number} [character.treasure_value] - Treasure value, expressed in the currency's
   *   lowest denomination, rendered read-only alongside `money` (issue #616).
   * @param {string} [character.game_type] - Currency model name (e.g. `dnd`, `deadlands`)
   *   of the character's own game, resolved live rather than stored on the character.
   *   Defaults to `dnd`.
   * @param {boolean} [character.can_edit] - Whether the current user may edit this character;
   *   also gates the "Edit" link rendered beneath the money breakdown (issue #915).
   * @param {boolean} [character.is_player] - Whether the current user is a player of the
   *   game (but not necessarily this character's editor), gates the single player-facing
   *   slain/revive button, and unconditionally gates the Edit button too, since any player
   *   may edit either an NPC's or a PC's player-writable fields.
   * @param {boolean} [character.is_staff] - Whether the current user is a Staff account;
   *   together with `is_pc`, also gates the Edit button for PCs, since Staff may edit a PC's
   *   player-writable fields even when not a player of the game.
   * @param {boolean} [character.is_pc] - Whether the character is a PC (vs. an NPC), used
   *   to pick the `showTypeConfig` type and to build the correct edit link segment.
   * @param {boolean} [character.private_slain] - Whether the character is (really) slain
   *   (DM-facing data only); together with `public_slain`, drives grayscale rendering (private
   *   takes priority, falling back to public) and the real slain/revive button label.
   * @param {boolean} [character.public_slain] - Whether the character is publicly slain,
   *   drives the public and player-facing slain/revive button labels.
   * @param {boolean} [character.hidden] - Whether the character is hidden (NPC-only concept;
   *   only present when the current user may edit the character); drives dimmed photo rendering.
   * @param {string} [character.private_allegiance] - The character's real allegiance
   *   (`'ally'`, `'enemy'`, `'neutral'`, or missing), DM-facing data only.
   * @param {string} [character.public_allegiance] - The character's publicly known allegiance
   *   (`'ally'`, `'enemy'`, `'neutral'`, or missing); together with `private_allegiance`, drives
   *   the picture border color for NPCs only (private takes priority, falling back to public).
   * @param {string} [character.game_slug] - Slug of the game the character belongs to.
   * @param {number|string} [character.id] - Character id.
   * @param {object[]} [character.photos] - Preview list of the character's photos
   *   (`id`, `path`), rendered as a static card grid with a link to the full gallery page.
   * @param {string} backHref - Hash path to the character's index page.
   * @param {{onOpenUploadModal: Function, onOpenSlainModal: Function,
   *   onOpenPublicSlainModal: Function, onOpenPlayerSlainModal: Function,
   *   onOpenMoneyModal: Function, onSelectPhoto: Function}} [handlers] - Event handlers.
   * @returns {React.ReactElement} Character detail element.
   */
  static render(character, backHref, handlers = {}) {
    const segment = character.is_pc ? 'pcs' : 'npcs';

    return (
      <ShowPageLayout
        type={character.is_pc ? 'pc' : 'npc'}
        mode="show"
        backHref={backHref}
        pageActions={(
          <ConditionalComponent
            render={character.can_edit || character.is_player || (character.is_pc && character.is_staff)}
          >
            <EditButton href={`#/games/${character.game_slug}/${segment}/${character.id}/edit`}>
              {Translator.t('character_page.edit')}
            </EditButton>
          </ConditionalComponent>
        )}
        context={{ ...character, handlers }}
      />
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

}
