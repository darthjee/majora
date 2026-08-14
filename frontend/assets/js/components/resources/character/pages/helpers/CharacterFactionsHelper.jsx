import React from 'react';
import PageActions from '../../../../common/list_page/PageActions.jsx';
import UploadButton from '../../../../common/buttons/UploadButton.jsx';
import ListPage from '../../../../common/list_page/ListPage.jsx';
import Translator from '../../../../../i18n/Translator.js';

/**
 * Rendering helper shared by the PcCharacterFactions and NpcCharacterFactions pages, mirroring
 * `CharacterDocumentsHelper`'s per-kind sharing but for the `ListPage`-backed faction list (issue
 * #943). No "New"/"Add" action or upload modal, no detail page to link to — but an optional
 * "Enlist" trigger opening the faction exchange modal (button label per the issue: "enlist", not
 * the modal's own "Faction Exchange" title, unlike `CharacterDocumentsHelper`'s button, which
 * reuses its modal's title verbatim).
 */
export default class CharacterFactionsHelper {
  /**
   * Render the factions page: header (back button, optional "Enlist" action, heading) and the
   * shared `ListPage` grid (type `pc-factions`/`npc-factions`).
   *
   * @param {string} characterKind - Character kind (`'pcs'` or `'npcs'`), used as the URL segment.
   * @param {string} listType - `listTypeConfig` key for this character kind
   *   (`'pc-factions'`/`'npc-factions'`).
   * @param {string} gameSlug - Game slug the character belongs to.
   * @param {string|number} characterId - Character id.
   * @param {number} [refreshToken] - Opaque value bumped to re-trigger the list fetch after a
   *   successful exchange.
   * @param {Function} [onExchangeFactions] - Handler invoked when the "Enlist" button is
   *   clicked, opening the faction exchange modal. No button renders when omitted.
   * @returns {React.ReactElement} Rendered factions page.
   */
  static render(characterKind, listType, gameSlug, characterId, refreshToken = 0, onExchangeFactions = null) {
    const basePath = `#/games/${gameSlug}/${characterKind}/${characterId}/factions`;
    const backHref = `#/games/${gameSlug}/${characterKind}/${characterId}`;

    return (
      <>
        <div className="container mt-4">
          <PageActions backHref={backHref}>
            {CharacterFactionsHelper.#renderExchangeButton(onExchangeFactions)}
          </PageActions>
          <h1 className="mb-4">{Translator.t('character_factions_page.title')}</h1>
        </div>
        <ListPage
          type={listType}
          gameSlug={gameSlug}
          basePath={basePath}
          loadingMessage={Translator.t('character_factions_page.loading')}
          context={{ characterId }}
          refreshToken={refreshToken}
        />
      </>
    );
  }

  static #renderExchangeButton(onExchangeFactions) {
    if (!onExchangeFactions) {
      return null;
    }

    return (
      <UploadButton onClick={onExchangeFactions}>
        {Translator.t('character_factions_page.enlist_button')}
      </UploadButton>
    );
  }
}
