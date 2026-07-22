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
   * @param {boolean} [character.can_edit] - Whether the current user may edit this character.
   * @param {boolean} [character.can_edit_money] - Whether the current user may edit this
   *   character's money through the narrow money-only endpoint (issue #615), gating the
   *   "Edit" link rendered beneath the money breakdown independently of `can_edit`.
   * @param {boolean} [character.is_player] - Whether the current user is a player of the
   *   game (but not necessarily this character's editor), gates the single player-facing
   *   slain/revive button, and (together with `!is_pc`) also gates the Edit button for
   *   NPCs, since any player may edit an NPC's player-writable fields.
   * @param {boolean} [character.is_pc] - Whether the character is a PC (vs. an NPC), used
   *   to pick the `showTypeConfig` type and to build the correct edit link segment.
   * @param {boolean} [character.slain] - Whether the character is (really) slain for a DM,
   *   or its public-facing slain alias for a non-editor; drives grayscale rendering and the
   *   real/player slain/revive button label.
   * @param {boolean} [character.public_slain] - Whether the character is publicly slain,
   *   drives the public slain/revive button label (DM-facing data only).
   * @param {boolean} [character.hidden] - Whether the character is hidden (NPC-only concept;
   *   only present when the current user may edit the character); drives dimmed photo rendering.
   * @param {string} [character.allegiance] - Allegiance value (`'ally'`, `'enemy'`,
   *   `'neutral'`, or missing), drives the picture border color for NPCs only.
   * @param {string} [character.game_slug] - Slug of the game the character belongs to.
   * @param {number|string} [character.id] - Character id.
   * @param {object[]} [character.treasures] - Preview list of the character's treasures
   *   (`id`, `treasure_id`, `name`, `quantity`, `value`, `photo_path`), rendered as a card
   *   grid with a link to the full list page.
   * @param {object[]} [character.items] - Preview list of the character's items
   *   (`id`, `game_item_id`, `name`, `description`, `photo_path`, already fallback-resolved
   *   server-side), rendered as a card grid with a link to the full list page.
   * @param {object[]} [character.documents] - Preview list of the character's documents
   *   (`id`, `game_document_id`, `name`, `photo_path`, already fallback-resolved server-side),
   *   rendered as a card grid with a link to the full list page, beneath the items preview.
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
          <ConditionalComponent render={character.can_edit || (character.is_player && !character.is_pc)}>
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
