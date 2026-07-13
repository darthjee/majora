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

  it('renders the gems overflow line', function() {
    const html = renderToStaticMarkup(React.createElement(CharacterMoney, { money: 32220 }));
    expect(html).toContain('100 GP in gems');
  });

  it('renders nothing when money is 0', function() {
    const html = renderToStaticMarkup(React.createElement(CharacterMoney, { money: 0 }));
    expect(html).toBe('');
  });
});
