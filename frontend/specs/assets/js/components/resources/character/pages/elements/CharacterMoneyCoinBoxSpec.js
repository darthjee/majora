import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import CharacterMoneyCoinBox from '../../../../../../../../assets/js/components/resources/character/pages/elements/CharacterMoneyCoinBox.jsx';

describe('CharacterMoneyCoinBox', function() {
  it('renders the coin icon, translated abbreviation and amount', function() {
    const html = renderToStaticMarkup(
      React.createElement(CharacterMoneyCoinBox, { denominationKey: 'cp', quantity: 20 })
    );

    expect(html).toContain('coin-box-cp');
    expect(html).toContain('coin-icon');
    expect(html).toContain('CP');
    expect(html).toContain('20');
  });

  it('renders each denomination with its own color class', function() {
    ['cp', 'sp', 'gp', 'pp'].forEach((key) => {
      const html = renderToStaticMarkup(
        React.createElement(CharacterMoneyCoinBox, { denominationKey: key, quantity: 1 })
      );

      expect(html).toContain(`coin-box-${key}`);
    });
  });

  it('defaults the amount to 0 when quantity is not given', function() {
    const html = renderToStaticMarkup(
      React.createElement(CharacterMoneyCoinBox, { denominationKey: 'pp' })
    );

    expect(html).toContain('>0<');
  });

  it('shows 0 when quantity is explicitly 0', function() {
    const html = renderToStaticMarkup(
      React.createElement(CharacterMoneyCoinBox, { denominationKey: 'gp', quantity: 0 })
    );

    expect(html).toContain('>0<');
  });
});
