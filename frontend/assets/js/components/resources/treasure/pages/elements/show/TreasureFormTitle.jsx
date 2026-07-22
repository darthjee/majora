import React from 'react';
import ErrorAlert from '../../../../../common/misc/ErrorAlert.jsx';
import Translator from '../../../../../../i18n/Translator.js';

// Game-scoped treasure creation/edit reuse the `game_treasure_new_page`/`game_treasure_edit_page`
// translations `GameTreasureNewHelper`/`GameTreasureEditHelper` already used before this migration
// (issue #738). The global (non-game-scoped) `Treasure`/`TreasureNew`/`TreasureEdit` pages are not
// part of this issue's affected-pages list, so this `treasure` `showTypeConfig` entry only ever
// backs the game-scoped forms.
const TITLE_KEYS = { new: 'game_treasure_new_page.title', edit: 'game_treasure_edit_page.title' };
const ERROR_KEYS = { new: 'game_treasure_new_page.error', edit: 'game_treasure_edit_page.error' };

/**
 * New/edit-mode right-column slot: the form's page title, plus a submission error alert when the
 * last submit attempt failed.
 *
 * @param {object} context - Merged `ShowPageLayout` rendering context.
 * @param {'new'|'edit'} context.mode - Current page mode.
 * @param {string} context.status - Current submission status.
 * @returns {React.ReactElement} Heading element.
 */
export default function TreasureFormTitle({ mode, status }) {
  return (
    <>
      <h1>{Translator.t(TITLE_KEYS[mode])}</h1>
      {status === 'error' && <ErrorAlert error={Translator.t(ERROR_KEYS[mode])} />}
    </>
  );
}
