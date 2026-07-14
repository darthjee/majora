import CoinPacker from '../../../../../assets/js/utils/money/CoinPacker.js';
import CoinBreakdown from '../../../../../assets/js/utils/money/CoinBreakdown.js';

describe('CoinPacker', function() {
  describe('.pack', function() {
    it('returns 0 for an empty breakdown', function() {
      expect(new CoinPacker().pack({})).toBe(0);
    });

    it('returns 0 when no breakdown is provided', function() {
      expect(new CoinPacker().pack()).toBe(0);
    });

    it('sums copper, silver, gold and platinum weighted by place value', function() {
      expect(new CoinPacker().pack({
        cp: 2, sp: 3, gp: 4, pp: 5,
      })).toBe(2 + 3 * 10 + 4 * 100 + 5 * 1000);
    });

    it('adds the gems entry converted at the GP-equivalent rate for the default denominations', function() {
      expect(new CoinPacker().pack({ gems: 2 })).toBe(200);
    });

    it('treats missing fields as 0', function() {
      expect(new CoinPacker().pack({ gp: 1 })).toBe(100);
    });

    it('treats non-numeric fields as 0', function() {
      expect(new CoinPacker().pack({ cp: 'oops', sp: 3 })).toBe(30);
    });

    describe('with a restricted denomination subset', function() {
      it('does not add a gems term even when gems is present', function() {
        const packer = new CoinPacker({ denominations: ['cp', 'sp', 'gp'] });

        expect(packer.pack({ cp: 2, sp: 5, gp: 1000, gems: 5 })).toBe(2 + 5 * 10 + 1000 * 100);
      });

      it('returns 0 for an empty breakdown', function() {
        const packer = new CoinPacker({ denominations: ['cp', 'sp', 'gp'] });

        expect(packer.pack({})).toBe(0);
      });
    });

    describe('round-tripping with CoinBreakdown', function() {
      const roundTrip = (money, options) => {
        const breakdownEntries = new CoinBreakdown(options).build(money);
        const breakdown = Object.fromEntries(breakdownEntries.map((entry) => [entry.key, entry.quantity]));

        return new CoinPacker(options).pack(breakdown);
      };

      it('round-trips representative default-denomination totals', function() {
        [0, 1, 10, 30, 310, 320, 332, 32220, 32221].forEach((money) => {
          expect(roundTrip(money)).toBe(money);
        });
      });

      it('round-trips representative treasure-style totals', function() {
        const options = { denominations: ['cp', 'sp', 'gp'], cascadeThreshold: 10 };

        [0, 5, 52, 100052, 100000].forEach((money) => {
          expect(roundTrip(money, options)).toBe(money);
        });
      });
    });
  });
});
