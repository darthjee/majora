import React from 'react';
import ErrorAlert from '../../../../../common/misc/ErrorAlert.jsx';
import Translator from '../../../../../../i18n/Translator.js';

// Item creation is character-scoped only (there's no `game-item` creation flow), and reuses the
// `character_item_new_page` translations `CharacterItemNewHelper` already used; item editing is
// shared by game/PC/NPC items and reuses the `item_edit_page` translations `ItemEditHelper`
// already used.
const TITLE_KEYS = { new: 'character_item_new_page.title', edit: 'item_edit_page.title' };
const ERROR_KEYS = { new: 'character_item_new_page.error', edit: 'item_edit_page.error' };

/**
 * New/edit-mode right-column slot: the form's page title, plus a submission error alert when the
 * last submit attempt failed.
 *
 * @param {object} context - Merged `ShowPageLayout` rendering context.
 * @param {'new'|'edit'} context.mode - Current page mode.
 * @param {string} context.status - Current submission status.
 * @returns {React.ReactElement} Heading element.
 */
export default function ItemTitle({ mode, status }) {
  return (
    <>
      <h1>{Translator.t(TITLE_KEYS[mode])}</h1>
      {status === 'error' && <ErrorAlert error={Translator.t(ERROR_KEYS[mode])} />}
    </>
  );
}
