import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import CharacterMoneyBill from '../../../../../../../../assets/js/components/resources/character/pages/elements/CharacterMoneyBill.jsx';

describe('CharacterMoneyBill', function() {
  it('delegates rendering to CharacterMoneyBillHelper', function() {
    const html = renderToStaticMarkup(React.createElement(CharacterMoneyBill, { money: 10002 }));

    expect(html).toContain('character-money-bill');
    expect(html).toContain('coin-icon');
    expect(html).toContain('100,02');
  });
});
