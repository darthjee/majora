import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import CharacterMoneyTreasureBox
  from '../../../../../../../../assets/js/components/resources/character/pages/elements/CharacterMoneyTreasureBox.jsx';

describe('CharacterMoneyTreasureBox', function() {
  it('delegates rendering to CharacterMoneyTreasureBoxHelper', function() {
    const html = renderToStaticMarkup(
      React.createElement(CharacterMoneyTreasureBox, { treasureValue: 2000 })
    );

    expect(html).toContain('coin-box-treasure');
    expect(html).toContain('20 GP in Gems');
  });

  it('renders nothing when treasureValue is 0', function() {
    const html = renderToStaticMarkup(
      React.createElement(CharacterMoneyTreasureBox, { treasureValue: 0 })
    );

    expect(html).toBe('');
  });
});
