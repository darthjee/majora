import React from 'react';
import ErrorAlert from '../../../../../common/misc/ErrorAlert.jsx';
import Translator from '../../../../../../i18n/Translator.js';

/**
 * Show-mode heading: the game's own name.
 *
 * @param {object} context - Merged `ShowPageLayout` rendering context.
 * @param {string} context.name - Game name.
 * @returns {React.ReactElement} Heading element.
 */
function GameHeadingShow({ name }) {
  return <h1>{name}</h1>;
}

/**
 * New-mode heading: the static page title, plus a submission error alert when the last
 * submit attempt failed.
 *
 * @param {object} context - Merged `ShowPageLayout` rendering context.
 * @param {string} context.status - Current submission status.
 * @returns {React.ReactElement} Heading element.
 */
function GameHeadingNew({ status }) {
  return (
    <>
      <h1>{Translator.t('game_new_page.title')}</h1>
      {status === 'error' && <ErrorAlert error={Translator.t('game_new_page.error')} />}
    </>
  );
}

/**
 * Edit-mode heading: the static page title, plus a submission error alert when the last
 * submit attempt failed.
 *
 * @param {object} context - Merged `ShowPageLayout` rendering context.
 * @param {string} context.status - Current submission status.
 * @returns {React.ReactElement} Heading element.
 */
function GameHeadingEdit({ status }) {
  return (
    <>
      <h1>{Translator.t('game_edit_page.title')}</h1>
      {status === 'error' && <ErrorAlert error={Translator.t('game_edit_page.error')} />}
    </>
  );
}

/**
 * Mode-variant heading slot for the game show/new/edit pages.
 */
const GameHeading = { Show: GameHeadingShow, New: GameHeadingNew, Edit: GameHeadingEdit };

export default GameHeading;
