import CoinBreakdown from '../../../../assets/js/utils/CoinBreakdown.js';

describe('CoinBreakdown', function() {
  describe('.build', function() {
    it('returns an empty array for 0', function() {
      expect(CoinBreakdown.build(0)).toEqual([]);
    });

    it('returns an empty array when money is not provided', function() {
      expect(CoinBreakdown.build()).toEqual([]);
    });

    it('renders a single copper entry for 1', function() {
      expect(CoinBreakdown.build(1)).toEqual([{ key: 'cp', quantity: 1 }]);
    });

    it('renders a single copper entry for 10', function() {
      expect(CoinBreakdown.build(10)).toEqual([{ key: 'cp', quantity: 10 }]);
    });

    it('cascades copper into silver for 30', function() {
      expect(CoinBreakdown.build(30)).toEqual([
        { key: 'cp', quantity: 20 },
        { key: 'sp', quantity: 1 },
      ]);
    });

    it('caps copper at 29 without cascading further for 310', function() {
      expect(CoinBreakdown.build(310)).toEqual([
        { key: 'cp', quantity: 20 },
        { key: 'sp', quantity: 29 },
      ]);
    });

    it('cascades silver into gold for 320', function() {
      expect(CoinBreakdown.build(320)).toEqual([
        { key: 'cp', quantity: 20 },
        { key: 'sp', quantity: 20 },
        { key: 'gp', quantity: 1 },
      ]);
    });

    it('handles a mixed remainder for 332', function() {
      expect(CoinBreakdown.build(332)).toEqual([
        { key: 'cp', quantity: 22 },
        { key: 'sp', quantity: 21 },
        { key: 'gp', quantity: 1 },
      ]);
    });

    it('overflows into gems for 32220', function() {
      expect(CoinBreakdown.build(32220)).toEqual([
        { key: 'cp', quantity: 20 },
        { key: 'sp', quantity: 20 },
        { key: 'gp', quantity: 20 },
        { key: 'pp', quantity: 20 },
        { key: 'gems', quantity: 100 },
      ]);
    });

    it('overflows into gems for 32221', function() {
      expect(CoinBreakdown.build(32221)).toEqual([
        { key: 'cp', quantity: 21 },
        { key: 'sp', quantity: 20 },
        { key: 'gp', quantity: 20 },
        { key: 'pp', quantity: 20 },
        { key: 'gems', quantity: 100 },
      ]);
    });
  });
});
