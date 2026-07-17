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

  it('forwards treasureValue into a gold treasure box', function() {
    const html = renderToStaticMarkup(
      React.createElement(CharacterMoneyBill, { money: 10002, treasureValue: 350 })
    );

    expect(html).toContain('character-money-bill-treasure');
    expect(html).toContain('3,50');
    expect(html).toContain('in Gems');
  });

  it('does not render a treasure box when treasureValue is 0', function() {
    const html = renderToStaticMarkup(React.createElement(CharacterMoneyBill, { money: 10002 }));

    expect(html).not.toContain('character-money-bill-treasure');
  });
});
