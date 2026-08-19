import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import useMoneyModal
  from '../../../../../../../../../assets/js/components/resources/character/pages/shared/hooks/useMoneyModal.js';

/**
 * Minimal component exercising `useMoneyModal`, capturing its return value for inspection.
 *
 * @param {object} props - Component props.
 * @param {Function} props.setField - `setField` spy passed through to the hook.
 * @param {Function} props.onResult - Called with the hook's return value.
 * @returns {React.ReactElement} A trivial element.
 */
function TestHost({ setField, onResult }) {
  onResult(useMoneyModal(setField));
  return React.createElement('div', null, 'ok');
}

const render = (setField) => {
  let captured;
  renderToStaticMarkup(
    React.createElement(TestHost, { setField, onResult: (result) => { captured = result; } }),
  );
  return captured;
};

describe('useMoneyModal', function() {
  it('starts with the modal closed', function() {
    const result = render(jasmine.createSpy('setField'));

    expect(result.showMoneyModal).toBe(false);
  });

  it('does not throw when opening or closing', function() {
    const result = render(jasmine.createSpy('setField'));

    expect(() => {
      result.openMoneyModal();
      result.closeMoneyModal();
    }).not.toThrow();
  });

  it('writes the confirmed total into the money field as a string', function() {
    const setField = jasmine.createSpy('setField');
    const result = render(setField);

    result.confirmMoneyModal(500);

    expect(setField).toHaveBeenCalledWith('money', '500');
  });
});
