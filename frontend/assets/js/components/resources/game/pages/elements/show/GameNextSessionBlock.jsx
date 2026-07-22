import React from 'react';
import Translator from '../../../../../../i18n/Translator.js';

/**
 * Render the next-session summary line, or a muted placeholder when the game has no
 * upcoming session at all.
 *
 * @param {{title: string, date: (string|null)}|null} nextSession - Upcoming session summary,
 *   or `null` when the game has no sessions.
 * @returns {React.ReactElement} Next-session summary paragraph.
 */
function renderSummary(nextSession) {
  if (!nextSession) {
    return <p className="text-muted">{Translator.t('game_page.no_next_session')}</p>;
  }

  return (
    <p>
      {nextSession.title}
      {' — '}
      {nextSession.date ?? Translator.t('game_session_page.no_date')}
    </p>
  );
}

/**
 * Show-mode left-column slot: the game's next-session summary and a link to its sessions list.
 *
 * @param {object} context - Merged `ShowPageLayout` rendering context.
 * @param {string} context.game_slug - Game slug, used to build the sessions link.
 * @param {{title: string, date: (string|null)}|null} [context.next_session] - Upcoming session
 *   summary, or `null` when the game has no sessions.
 * @returns {React.ReactElement} Next-session block element.
 */
export default function GameNextSessionBlock({ game_slug: gameSlug, next_session: nextSession }) {
  return (
    <div className="mt-4">
      <h2>{Translator.t('game_page.next_session_title')}</h2>
      {renderSummary(nextSession)}
      <a href={`#/games/${gameSlug}/sessions`} className="btn btn-secondary mb-3">
        {Translator.t('game_page.sessions')}
      </a>
    </div>
  );
}
