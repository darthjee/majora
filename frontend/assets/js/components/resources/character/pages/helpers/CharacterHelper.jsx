import React from 'react';
import EditButton from '../../../../common/buttons/EditButton.jsx';
import PageActions from '../../../../common/list_page/PageActions.jsx';
import ConditionalComponent from '../../../../common/misc/ConditionalComponent.jsx';
import CharacterAvatar from '../elements/CharacterAvatar.jsx';
import CharacterRole from '../elements/CharacterRole.jsx';
import CharacterDescription from '../elements/CharacterDescription.jsx';
import CharacterDmNotes from '../elements/CharacterDmNotes.jsx';
import CharacterMoney from '../elements/CharacterMoney.jsx';
import ErrorAlert from '../../../../common/misc/ErrorAlert.jsx';
import LinkList from '../../../../common/misc/LinkList.jsx';
import LoadingMessage from '../../../../common/misc/LoadingMessage.jsx';
import PreviewSection from '../../../../common/cards/PreviewSection.jsx';
import TreasurePreviewCard from '../../../../common/cards/TreasurePreviewCard.jsx';
import ItemPreviewCard from '../../../../common/cards/ItemPreviewCard.jsx';
import { PREVIEW_LIST_TYPES } from '../../../../common/cards/characterPreviewConstants.js';
import CharacterPhotosPreview from '../elements/CharacterPhotosPreview.jsx';
import Translator from '../../../../../i18n/Translator.js';

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
   * @param {object[]} [character.items] - Preview list of the character's items
   *   (`id`, `game_item_id`, `name`, `description`, `photo_path`, already fallback-resolved
   *   server-side), rendered as a card grid with a link to the full list page.
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
      <div className="container mt-4">
        <PageActions backHref={backHref}>
          <ConditionalComponent render={character.can_edit || (character.is_player && !character.is_pc)}>
            <EditButton href={`#/games/${character.game_slug}/${segment}/${character.id}/edit`}>
              {Translator.t('character_page.edit')}
            </EditButton>
          </ConditionalComponent>
        </PageActions>
        <div className="row">
          <div className="col-md-4">
            <CharacterAvatar character={character} handlers={handlers} />
            <h1>{character.name}</h1>
            <LinkList links={character.links} />
            <CharacterMoney
              money={character.money}
              treasureValue={character.treasure_value}
              gameType={character.game_type}
              canEditMoney={character.can_edit_money}
              onEditMoney={handlers.onOpenMoneyModal}
            />
          </div>
          <div className="col-md-8">
            <CharacterRole role={character.role} />
            <CharacterDescription description={character.public_description} />
            <CharacterDmNotes privateDescription={character.private_description} />
            <PreviewSection
              items={character.treasures ?? []}
              title={Translator.t(PREVIEW_LIST_TYPES.treasure.titleKey)}
              seeAllHref={`#/games/${character.game_slug}/${segment}/${character.id}/treasures`}
              icon={PREVIEW_LIST_TYPES.treasure.icon}
              emptyText={Translator.t('character_treasures_preview.empty')}
              renderItem={(treasure) => (
                <TreasurePreviewCard
                  key={treasure.id}
                  treasure={{
                    id: treasure.treasure_id,
                    name: treasure.name,
                    value: treasure.value,
                    photo_path: treasure.photo_path,
                    game_type: character.game_type,
                  }}
                  quantity={treasure.quantity}
                />
              )}
            />
            <PreviewSection
              items={character.items ?? []}
              title={Translator.t(PREVIEW_LIST_TYPES.item.titleKey)}
              seeAllHref={`#/games/${character.game_slug}/${segment}/${character.id}/items`}
              icon={PREVIEW_LIST_TYPES.item.icon}
              emptyText={Translator.t('character_items_preview.empty')}
              renderItem={(item) => <ItemPreviewCard key={item.id} item={item} />}
            />
          </div>
        </div>
        <CharacterPhotosPreview
          photos={character.photos ?? []}
          title={Translator.t('character_page.photos_title')}
          seeAllHref={`#/games/${character.game_slug}/${segment}/${character.id}/photos`}
          onSelectPhoto={handlers.onSelectPhoto}
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

}
