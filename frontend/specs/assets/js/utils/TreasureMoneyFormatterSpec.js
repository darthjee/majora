import formatTreasureValue from '../../../../assets/js/utils/TreasureMoneyFormatter.js';

describe('formatTreasureValue', function() {
  it('renders 0 as "0 GP"', function() {
    expect(formatTreasureValue(0)).toEqual('0 GP');
  });

  it('renders 0 as "0 GP" when value is not provided', function() {
    expect(formatTreasureValue()).toEqual('0 GP');
  });

  it('renders a gold-only value', function() {
    expect(formatTreasureValue(100000)).toEqual('1000 GP');
  });

  it('joins gold, silver and copper with commas and a trailing "and"', function() {
    expect(formatTreasureValue(100052)).toEqual('1000 GP, 5 SP and 2 CP');
  });

  it('omits zero-quantity denominations and joins the rest with "and"', function() {
    expect(formatTreasureValue(100150)).toEqual('1001 GP and 5 SP');
  });

  it('does not cap gold, absorbing all remaining value', function() {
    expect(formatTreasureValue(100000000)).toEqual('1000000 GP');
  });
});
