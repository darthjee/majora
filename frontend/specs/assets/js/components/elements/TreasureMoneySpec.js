import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import TreasureMoney from '../../../../../assets/js/components/elements/TreasureMoney.jsx';

describe('TreasureMoney', function() {
  it('renders 0 as "0 GP"', function() {
    const html = renderToStaticMarkup(React.createElement(TreasureMoney, { value: 0 }));
    expect(html).toEqual('0 GP');
  });

  it('renders "0 GP" when value is not provided', function() {
    const html = renderToStaticMarkup(React.createElement(TreasureMoney, {}));
    expect(html).toEqual('0 GP');
  });

  it('renders a gold-only value', function() {
    const html = renderToStaticMarkup(React.createElement(TreasureMoney, { value: 100000 }));
    expect(html).toEqual('1000 GP');
  });

  it('joins gold, silver and copper with commas and a trailing "and"', function() {
    const html = renderToStaticMarkup(React.createElement(TreasureMoney, { value: 100052 }));
    expect(html).toEqual('1000 GP, 5 SP and 2 CP');
  });

  it('omits zero-quantity denominations and joins the rest with "and"', function() {
    const html = renderToStaticMarkup(React.createElement(TreasureMoney, { value: 100150 }));
    expect(html).toEqual('1001 GP and 5 SP');
  });

  it('does not cap gold, absorbing all remaining value', function() {
    const html = renderToStaticMarkup(React.createElement(TreasureMoney, { value: 100000000 }));
    expect(html).toEqual('1000000 GP');
  });
});
