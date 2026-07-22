import React from 'react';
import OpenPollsWidget from '../OpenPollsWidget.jsx';

/**
 * Show-mode left-column slot adapting `ShowPageLayout`'s flat merged context back into
 * `OpenPollsWidget`'s expected `game` prop shape.
 *
 * @param {object} context - Merged `ShowPageLayout` rendering context (the game's own fields).
 * @returns {React.ReactElement|null} The open-polls widget, or `null` when not visible to the
 *   current user (handled by `OpenPollsWidget` itself).
 */
export default function GameOpenPollsWidgetSlot(context) {
  return <OpenPollsWidget game={context} />;
}
