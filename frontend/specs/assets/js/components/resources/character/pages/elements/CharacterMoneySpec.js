import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import CharacterMoney from '../../../../../../../../assets/js/components/resources/character/pages/elements/CharacterMoney.jsx';

describe('CharacterMoney', function() {
  it('renders all four coin boxes, including zero amounts', function() {
    const html = renderToStaticMarkup(React.createElement(CharacterMoney, { money: 310 }));
    expect(html).toContain('coin-box-cp');
    expect(html).toContain('coin-box-sp');
    expect(html).toContain('coin-box-gp');
    expect(html).toContain('coin-box-pp');
    expect(html).toContain('20');
    expect(html).toContain('29');
  });

  it('shows 0 for zero-quantity denominations instead of omitting them', function() {
    const html = renderToStaticMarkup(React.createElement(CharacterMoney, { money: 1 }));
    expect(html).toContain('CP');
    expect(html).toContain('SP');
    expect(html).toContain('GP');
    expect(html).toContain('PP');
    expect(html).toContain('>1<');
    expect(html).toContain('>0<');
  });

  it('lets platinum absorb all remaining value instead of overflowing into gems', function() {
    const html = renderToStaticMarkup(React.createElement(CharacterMoney, { money: 32220 }));
    expect(html).toContain('coin-box-pp');
    expect(html).toContain('30');
    expect(html).not.toContain('gems');
  });

  it('still renders all four coin boxes when money is 0', function() {
    const html = renderToStaticMarkup(React.createElement(CharacterMoney, { money: 0 }));
    expect(html).toContain('coin-box-cp');
    expect(html).toContain('coin-box-sp');
    expect(html).toContain('coin-box-gp');
    expect(html).toContain('coin-box-pp');
  });

  it('renders a cents/dollars breakdown when gameType is deadlands', function() {
    const html = renderToStaticMarkup(React.createElement(CharacterMoney, { money: 350, gameType: 'deadlands' }));
    expect(html).toContain('50 Cents | 3 Dollars');
  });

  it('defaults gameType to dnd when not given', function() {
    const html = renderToStaticMarkup(React.createElement(CharacterMoney, { money: 310 }));
    expect(html).toContain('character-money-coins');
    expect(html).not.toContain('character-money"');
  });
});
