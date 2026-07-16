import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import CharacterMoneyCoins from '../../../../../../../../assets/js/components/resources/character/pages/elements/CharacterMoneyCoins.jsx';

describe('CharacterMoneyCoins', function() {
  it('delegates rendering to CharacterMoneyCoinsHelper', function() {
    const html = renderToStaticMarkup(React.createElement(CharacterMoneyCoins, { money: 332 }));

    expect(html).toContain('character-money-coins');
    expect(html).toContain('coin-box-cp');
    expect(html).toContain('coin-box-sp');
    expect(html).toContain('coin-box-gp');
    expect(html).toContain('coin-box-pp');
  });
});
