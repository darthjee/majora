import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import CharacterMoney from '../../../../../../../../assets/js/components/resources/character/pages/elements/CharacterMoney.jsx';

describe('CharacterMoney', function() {
  it('renders the coin breakdown line', function() {
    const html = renderToStaticMarkup(React.createElement(CharacterMoney, { money: 310 }));
    expect(html).toContain('20 CP');
    expect(html).toContain('29 SP');
    expect(html).toContain('|');
  });

  it('omits zero-quantity denominations', function() {
    const html = renderToStaticMarkup(React.createElement(CharacterMoney, { money: 1 }));
    expect(html).toContain('1 CP');
    expect(html).not.toContain('SP');
    expect(html).not.toContain('GP');
    expect(html).not.toContain('PP');
  });

  it('lets platinum absorb all remaining value instead of overflowing into gems', function() {
    const html = renderToStaticMarkup(React.createElement(CharacterMoney, { money: 32220 }));
    expect(html).toContain('20 CP | 20 SP | 20 GP | 30 PP');
    expect(html).not.toContain('gems');
  });

  it('renders nothing when money is 0', function() {
    const html = renderToStaticMarkup(React.createElement(CharacterMoney, { money: 0 }));
    expect(html).toBe('');
  });

  it('renders a cents/dollars breakdown when gameType is deadlands', function() {
    const html = renderToStaticMarkup(React.createElement(CharacterMoney, { money: 350, gameType: 'deadlands' }));
    expect(html).toContain('50 Cents | 3 Dollars');
  });

  it('defaults gameType to dnd when not given', function() {
    const html = renderToStaticMarkup(React.createElement(CharacterMoney, { money: 310 }));
    expect(html).toContain('20 CP | 29 SP');
  });
});
