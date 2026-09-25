import React from 'react';
import Translator from '../../../i18n/Translator.js';

/**
 * Query and Clear buttons shared by the app's filter bars, each wrapped in
 * the `col-auto` spacing used by the other filter controls.
 *
 * @param {object} props - Component props.
 * @param {Function} props.onQuery - Called when the Query button is clicked.
 * @param {Function} props.onClear - Called when the Clear button is clicked.
 * @param {string} props.testIdPrefix - Prefix for the buttons' `data-testid`, rendered as
 *   `<testIdPrefix>-filter-query` and `<testIdPrefix>-filter-clear`.
 * @returns {React.ReactElement} Rendered Query/Clear buttons.
 */
export default function FilterActions({ onQuery, onClear, testIdPrefix }) {
  return (
    <>
      <div className="col-auto">
        <button
          type="button"
          className="btn btn-primary"
          data-testid={`${testIdPrefix}-filter-query`}
          onClick={onQuery}
        >
          {Translator.t('filter_actions.query')}
        </button>
      </div>
      <div className="col-auto">
        <button
          type="button"
          className="btn btn-outline-secondary"
          data-testid={`${testIdPrefix}-filter-clear`}
          onClick={onClear}
        >
          {Translator.t('filter_actions.clear')}
        </button>
      </div>
    </>
  );
}
