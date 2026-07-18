import React from 'react';
import Translator from '../../../../i18n/Translator.js';

/**
 * Rendering helper for the BackButton element.
 */
export default class BackButtonHelper {
  /**
   * Render a link styled as a back button.
   *
   * @param {string} href - Hash path to navigate back to.
   * @returns {React.ReactElement} Back button element.
   */
  static render(href) {
    return (
      <a href={href} className="btn btn-outline-secondary mb-3">
        &larr; {Translator.t('back_button.label')}
      </a>
    );
  }
}
