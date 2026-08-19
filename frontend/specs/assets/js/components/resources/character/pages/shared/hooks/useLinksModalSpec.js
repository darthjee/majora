import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import useLinksModal
  from '../../../../../../../../../assets/js/components/resources/character/pages/shared/hooks/useLinksModal.js';

/**
 * Minimal component exercising `useLinksModal`, capturing its return value for inspection.
 *
 * @param {object} props - Component props.
 * @param {Function} props.onResult - Called with the hook's return value.
 * @returns {React.ReactElement} A trivial element.
 */
function TestHost({ onResult }) {
  onResult(useLinksModal());
  return React.createElement('div', null, 'ok');
}

const render = () => {
  let captured;
  renderToStaticMarkup(React.createElement(TestHost, { onResult: (result) => { captured = result; } }));
  return captured;
};

describe('useLinksModal', function() {
  it('starts with an empty links array and the modal closed', function() {
    const result = render();

    expect(result.links).toEqual([]);
    expect(result.showLinksModal).toBe(false);
  });

  it('does not throw when opening, closing, or confirming', function() {
    const result = render();

    expect(() => {
      result.openLinksModal();
      result.closeLinksModal();
      result.confirmLinksModal([{ id: 1, text: 'Wiki', url: 'https://example.com', link_type: '' }]);
    }).not.toThrow();
  });

  it('exposes the raw setLinks setter', function() {
    const result = render();

    expect(typeof result.setLinks).toBe('function');
  });
});
