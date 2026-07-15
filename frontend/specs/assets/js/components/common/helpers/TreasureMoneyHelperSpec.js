import TreasureMoneyHelper from '../../../../../../assets/js/components/common/helpers/TreasureMoneyHelper.jsx';

describe('TreasureMoneyHelper', function() {
  describe('.render', function() {
    it('renders 0 as "0 GP"', function() {
      expect(TreasureMoneyHelper.render(0)).toEqual('0 GP');
    });

    it('renders "0 GP" when value is not provided', function() {
      expect(TreasureMoneyHelper.render()).toEqual('0 GP');
    });

    it('renders a gold-only value', function() {
      expect(TreasureMoneyHelper.render(100000)).toEqual('1000 GP');
    });

    it('joins gold, silver and copper with commas and a trailing "and"', function() {
      expect(TreasureMoneyHelper.render(100052)).toEqual('1000 GP, 5 SP and 2 CP');
    });

    it('omits zero-quantity denominations and joins the rest with "and"', function() {
      expect(TreasureMoneyHelper.render(100150)).toEqual('1001 GP and 5 SP');
    });

    it('does not cap gold, absorbing all remaining value', function() {
      expect(TreasureMoneyHelper.render(100000000)).toEqual('1000000 GP');
    });

    it('accepts an explicit "dnd" gameType', function() {
      expect(TreasureMoneyHelper.render(100052, 'dnd')).toEqual('1000 GP, 5 SP and 2 CP');
    });

    describe('with a "deadlands" gameType', function() {
      it('renders 0 as "0 Dollars"', function() {
        expect(TreasureMoneyHelper.render(0, 'deadlands')).toEqual('0 Dollars');
      });

      it('renders "0 Dollars" when value is not provided', function() {
        expect(TreasureMoneyHelper.render(undefined, 'deadlands')).toEqual('0 Dollars');
      });

      it('joins dollars and cents with "and"', function() {
        expect(TreasureMoneyHelper.render(350, 'deadlands')).toEqual('3 Dollars and 50 Cents');
      });

      it('omits a zero-quantity denomination', function() {
        expect(TreasureMoneyHelper.render(300, 'deadlands')).toEqual('3 Dollars');
        expect(TreasureMoneyHelper.render(50, 'deadlands')).toEqual('50 Cents');
      });
    });
  });
});
