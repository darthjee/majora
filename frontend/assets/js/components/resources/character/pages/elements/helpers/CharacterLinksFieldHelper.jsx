import React from 'react';
import LinkList from '../../../../../common/LinkList.jsx';

/**
 * Rendering helper for the CharacterLinksField element.
 */
export default class CharacterLinksFieldHelper {
  /**
   * Render the read-only links preview and the "Edit links" button.
   *
   * @param {object[]} links - Current links array.
   * @param {string} buttonLabel - Translated "Edit links" button label.
   * @param {Function} onOpenLinksModal - Handler invoked when the button is clicked.
   * @returns {React.ReactElement} Links field element.
   */
  static render(links, buttonLabel, onOpenLinksModal) {
    return (
      <>
        <LinkList links={links.filter((link) => !link.delete)} />
        <button
          type="button"
          className="btn btn-outline-secondary btn-sm mb-3"
          onClick={onOpenLinksModal}
        >
          {buttonLabel}
        </button>
      </>
    );
  }
}
