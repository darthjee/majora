import React from 'react';
import Translator from '../../../i18n/Translator.js';

/**
 * Rendering helper for the LanguageSelector element.
 */
export default class LanguageSelectorHelper {
  /**
   * Renders a language dropdown listing flag + code for each available language.
   *
   * @param {{language: string, options: {code: string, flag: string}[]}} state - selector state.
   * @param {{onChange: Function}} handlers - selector event handlers.
   * @returns {React.ReactElement} language selector element.
   */
  static render(state, handlers) {
    return (
      <select
        aria-label={Translator.t('language_selector.label')}
        data-testid="language-selector"
        className="form-select form-select-sm w-auto"
        value={state.language}
        onChange={handlers.onChange}
      >
        {state.options.map((option) => (
          <option key={option.code} value={option.code}>
            {`${option.flag} ${option.code}`}
          </option>
        ))}
      </select>
    );
  }
}
