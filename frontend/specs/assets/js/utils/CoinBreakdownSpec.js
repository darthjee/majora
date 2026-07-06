import CoinBreakdown, { cascadeStep } from '../../../../assets/js/utils/CoinBreakdown.js';

describe('CoinBreakdown', function() {
  describe('cascadeStep', function() {
    it('does not cascade below the default threshold', function() {
      expect(cascadeStep(29)).toEqual({ quantity: 29, remaining: 0 });
    });

    it('cascades at the default threshold', function() {
      expect(cascadeStep(30)).toEqual({ quantity: 20, remaining: 1 });
    });

    it('accepts a custom threshold that is a multiple of 10', function() {
      expect(cascadeStep(40, 40)).toEqual({ quantity: 30, remaining: 1 });
    });

    it('throws when the threshold is not a multiple of 10', function() {
      expect(() => cascadeStep(30, 29)).toThrowError(
        'Cascade threshold must be a multiple of 10, got 29'
      );
    });
  });


  describe('.build', function() {
    it('returns an empty array for 0', function() {
      expect(new CoinBreakdown().build(0)).toEqual([]);
    });

    it('returns an empty array when money is not provided', function() {
      expect(new CoinBreakdown().build()).toEqual([]);
    });

    it('renders a single copper entry for 1', function() {
      expect(new CoinBreakdown().build(1)).toEqual([{ key: 'cp', quantity: 1 }]);
    });

    it('renders a single copper entry for 10', function() {
      expect(new CoinBreakdown().build(10)).toEqual([{ key: 'cp', quantity: 10 }]);
    });

    it('cascades copper into silver for 30', function() {
      expect(new CoinBreakdown().build(30)).toEqual([
        { key: 'cp', quantity: 20 },
        { key: 'sp', quantity: 1 },
      ]);
    });

    it('caps copper at 29 without cascading further for 310', function() {
      expect(new CoinBreakdown().build(310)).toEqual([
        { key: 'cp', quantity: 20 },
        { key: 'sp', quantity: 29 },
      ]);
    });

    it('cascades silver into gold for 320', function() {
      expect(new CoinBreakdown().build(320)).toEqual([
        { key: 'cp', quantity: 20 },
        { key: 'sp', quantity: 20 },
        { key: 'gp', quantity: 1 },
      ]);
    });

    it('handles a mixed remainder for 332', function() {
      expect(new CoinBreakdown().build(332)).toEqual([
        { key: 'cp', quantity: 22 },
        { key: 'sp', quantity: 21 },
        { key: 'gp', quantity: 1 },
      ]);
    });

    it('overflows into gems for 32220', function() {
      expect(new CoinBreakdown().build(32220)).toEqual([
        { key: 'cp', quantity: 20 },
        { key: 'sp', quantity: 20 },
        { key: 'gp', quantity: 20 },
        { key: 'pp', quantity: 20 },
        { key: 'gems', quantity: 100 },
      ]);
    });

    it('overflows into gems for 32221', function() {
      expect(new CoinBreakdown().build(32221)).toEqual([
        { key: 'cp', quantity: 21 },
        { key: 'sp', quantity: 20 },
        { key: 'gp', quantity: 20 },
        { key: 'pp', quantity: 20 },
        { key: 'gems', quantity: 100 },
      ]);
    });
  });

  describe('with a restricted denomination subset', function() {
    it('absorbs all remaining value into the last denomination', function() {
      const breakdown = new CoinBreakdown({ denominations: ['cp', 'sp', 'gp'], cascadeThreshold: 10 });

      expect(breakdown.build(100052)).toEqual([
        { key: 'cp', quantity: 2 },
        { key: 'sp', quantity: 5 },
        { key: 'gp', quantity: 1000 },
      ]);
    });

    it('does not overflow into gems even when a lot of value remains', function() {
      const breakdown = new CoinBreakdown({ denominations: ['cp', 'sp', 'gp'], cascadeThreshold: 10 });

      expect(breakdown.build(100000)).toEqual([{ key: 'gp', quantity: 1000 }]);
    });

    it('returns an empty array for 0', function() {
      const breakdown = new CoinBreakdown({ denominations: ['cp', 'sp', 'gp'], cascadeThreshold: 10 });

      expect(breakdown.build(0)).toEqual([]);
    });
  });
});
