import React from 'react';
import LinkList from '../../../../../common/misc/LinkList.jsx';
import LinksField from '../../../../../common/misc/LinksField.jsx';
import Translator from '../../../../../../i18n/Translator.js';

/**
 * Show-mode left-column slot: the game's external links.
 *
 * @param {object} context - Merged `ShowPageLayout` rendering context.
 * @param {object[]} [context.links] - Game's external links.
 * @returns {React.ReactElement} Link list element.
 */
export function GameLinksShow({ links }) {
  return <LinkList links={links} />;
}

/**
 * Build the edit-mode links field slot for the game edit page.
 *
 * @param {string} buttonLabelKey - Translated "Edit links" button i18n key.
 * @returns {Function} Edit-mode links field slot component.
 */
export function buildGameLinksField(buttonLabelKey) {
  return function GameLinksEdit({ links = [], handlers }) {
    return (
      <LinksField
        links={links}
        buttonLabel={Translator.t(buttonLabelKey)}
        onOpenLinksModal={handlers.onOpenLinksModal}
      />
    );
  };
}

export default GameLinksShow;
