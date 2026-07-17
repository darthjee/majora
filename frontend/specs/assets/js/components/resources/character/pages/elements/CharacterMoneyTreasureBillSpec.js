import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import CharacterMoneyTreasureBill
  from '../../../../../../../../assets/js/components/resources/character/pages/elements/CharacterMoneyTreasureBill.jsx';

describe('CharacterMoneyTreasureBill', function() {
  it('delegates rendering to CharacterMoneyTreasureBillHelper', function() {
    const html = renderToStaticMarkup(
      React.createElement(CharacterMoneyTreasureBill, { treasureValue: 10002 })
    );

    expect(html).toContain('character-money-bill-treasure');
    expect(html).toContain('100,02');
    expect(html).toContain('in Gems');
  });

  it('renders nothing when treasureValue is 0', function() {
    const html = renderToStaticMarkup(
      React.createElement(CharacterMoneyTreasureBill, { treasureValue: 0 })
    );

    expect(html).toBe('');
  });
});
