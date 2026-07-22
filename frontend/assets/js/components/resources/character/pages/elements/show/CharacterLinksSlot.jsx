import React from 'react';
import LinkList from '../../../../../common/misc/LinkList.jsx';
import CharacterLinksField from '../CharacterLinksField.jsx';
import Translator from '../../../../../../i18n/Translator.js';

/**
 * Show-mode left-column slot: the character's external links, identical for PCs and NPCs.
 *
 * @param {object} context - Merged `ShowPageLayout` rendering context.
 * @param {object[]} [context.links] - Character's external links.
 * @returns {React.ReactElement|null} Link list element, or null.
 */
function CharacterLinksShow({ links }) {
  return <LinkList links={links} />;
}

/**
 * Build the new/edit-mode links field slot for a character kind.
 *
 * @param {{edit: string, new: string}} buttonLabelKeys - Per-mode "Edit links" button i18n key,
 *   keyed by `'edit'` and/or `'new'` (PCs only ever provide `'edit'`).
 * @returns {Function} New/edit-mode links field slot component.
 */
export function buildCharacterLinksField(buttonLabelKeys) {
  return function CharacterLinksEditOrNew({ mode, links = [], handlers }) {
    return (
      <CharacterLinksField
        links={links}
        buttonLabel={Translator.t(buttonLabelKeys[mode])}
        onOpenLinksModal={handlers.onOpenLinksModal}
      />
    );
  };
}

export default CharacterLinksShow;
