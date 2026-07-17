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

  it('renders a dollar bill box when gameType is deadlands', function() {
    const html = renderToStaticMarkup(React.createElement(CharacterMoney, { money: 350, gameType: 'deadlands' }));
    expect(html).toContain('character-money-bill');
    expect(html).toContain('3,50');
  });

  it('defaults gameType to dnd when not given', function() {
    const html = renderToStaticMarkup(React.createElement(CharacterMoney, { money: 310 }));
    expect(html).toContain('character-money-coins');
    expect(html).not.toContain('character-money"');
  });

  it('does not render an edit link by default (no new props passed)', function() {
    const html = renderToStaticMarkup(React.createElement(CharacterMoney, { money: 310 }));
    expect(html).not.toContain('Edit money');
    expect(html).not.toContain('<button');
  });

  it('does not render an edit link when canEditMoney is false', function() {
    const html = renderToStaticMarkup(
      React.createElement(CharacterMoney, { money: 310, canEditMoney: false })
    );
    expect(html).not.toContain('Edit money');
  });

  it('renders an edit link when canEditMoney is true', function() {
    const onEditMoney = jasmine.createSpy('onEditMoney');
    const html = renderToStaticMarkup(
      React.createElement(CharacterMoney, { money: 310, canEditMoney: true, onEditMoney })
    );
    expect(html).toContain('Edit money');
  });

  it('does not render a dnd treasure box when treasureValue is 0', function() {
    const html = renderToStaticMarkup(React.createElement(CharacterMoney, { money: 310 }));
    expect(html).not.toContain('coin-box-treasure');
  });

  it('renders "20 GP in Gems" for a dnd treasureValue of 2000', function() {
    const html = renderToStaticMarkup(
      React.createElement(CharacterMoney, { money: 310, treasureValue: 2000 })
    );
    expect(html).toContain('coin-box-treasure');
    expect(html).toContain('20 GP in Gems');
  });

  it('renders "2 SP | 20 GP in Gems" for a dnd treasureValue of 2020', function() {
    const html = renderToStaticMarkup(
      React.createElement(CharacterMoney, { money: 310, treasureValue: 2020 })
    );
    expect(html).toContain('2 SP | 20 GP in Gems');
  });

  it('does not render a deadlands treasure box when treasureValue is 0', function() {
    const html = renderToStaticMarkup(
      React.createElement(CharacterMoney, { money: 350, gameType: 'deadlands' })
    );
    expect(html).not.toContain('character-money-bill-treasure');
  });

  it('renders a gold deadlands treasure box for a non-zero treasureValue', function() {
    const html = renderToStaticMarkup(
      React.createElement(CharacterMoney, { money: 350, treasureValue: 10002, gameType: 'deadlands' })
    );
    expect(html).toContain('character-money-bill-treasure');
    expect(html).toContain('100,02');
    expect(html).toContain('in Gems');
  });
});
