import DeadlandsMoneyModel from '../../../../../assets/js/utils/money/DeadlandsMoneyModel.js';
import MoneyModelRegistry from '../../../../../assets/js/utils/money/MoneyModelRegistry.js';

describe('DeadlandsMoneyModel', function() {
  describe('.transform', function() {
    it('registers itself under "deadlands" on the money model registry', function() {
      expect(MoneyModelRegistry.resolve('deadlands')).toBe(DeadlandsMoneyModel);
    });

    it('returns an empty array for 0', function() {
      expect(DeadlandsMoneyModel.transform(0)).toEqual([]);
    });

    it('returns an empty array when no value is given', function() {
      expect(DeadlandsMoneyModel.transform()).toEqual([]);
    });

    it('breaks a value under 100 cents into cents only', function() {
      expect(DeadlandsMoneyModel.transform(50)).toEqual([{ key: 'cents', quantity: 50 }]);
    });

    it('breaks an exact multiple of 100 into dollars only', function() {
      expect(DeadlandsMoneyModel.transform(300)).toEqual([{ key: 'dollars', quantity: 3 }]);
    });

    it('breaks a mixed value into cents and dollars', function() {
      expect(DeadlandsMoneyModel.transform(350)).toEqual([
        { key: 'cents', quantity: 50 },
        { key: 'dollars', quantity: 3 },
      ]);
    });

    it('does not use a base-10 cascade (unlike DndMoneyModel)', function() {
      expect(DeadlandsMoneyModel.transform(250)).toEqual([
        { key: 'cents', quantity: 50 },
        { key: 'dollars', quantity: 2 },
      ]);
    });

    it('ignores the context option, behaving identically for character and treasure', function() {
      expect(DeadlandsMoneyModel.transform(350, { context: 'character' }))
        .toEqual(DeadlandsMoneyModel.transform(350, { context: 'treasure' }));
    });
  });

  describe('.pack', function() {
    it('sums cents and dollars weighted by their relative value', function() {
      expect(DeadlandsMoneyModel.pack({ cents: 50, dollars: 3 })).toBe(350);
    });

    it('treats a missing breakdown as 0', function() {
      expect(DeadlandsMoneyModel.pack()).toBe(0);
    });

    it('treats missing/non-numeric fields as 0', function() {
      expect(DeadlandsMoneyModel.pack({ dollars: 3 })).toBe(300);
      expect(DeadlandsMoneyModel.pack({ cents: 50 })).toBe(50);
      expect(DeadlandsMoneyModel.pack({ cents: 'oops', dollars: 3 })).toBe(300);
    });

    it('round-trips with .transform for a representative total', function() {
      const breakdown = DeadlandsMoneyModel.transform(350)
        .reduce((acc, entry) => ({ ...acc, [entry.key]: entry.quantity }), {});

      expect(DeadlandsMoneyModel.pack(breakdown)).toBe(350);
    });

    it('ignores the context option', function() {
      expect(DeadlandsMoneyModel.pack({ cents: 50, dollars: 3 }, { context: 'character' }))
        .toBe(DeadlandsMoneyModel.pack({ cents: 50, dollars: 3 }, { context: 'treasure' }));
    });
  });

  describe('.denominationKeys', function() {
    it('always returns cents/dollars, regardless of context', function() {
      expect(DeadlandsMoneyModel.denominationKeys('character')).toEqual(['cents', 'dollars']);
      expect(DeadlandsMoneyModel.denominationKeys('treasure')).toEqual(['cents', 'dollars']);
      expect(DeadlandsMoneyModel.denominationKeys()).toEqual(['cents', 'dollars']);
    });
  });

  describe('.labelKey', function() {
    it('resolves the abbreviation translation key for each denomination', function() {
      expect(DeadlandsMoneyModel.labelKey('cents')).toBe('money.cents_abbreviation');
      expect(DeadlandsMoneyModel.labelKey('dollars')).toBe('money.dollars_abbreviation');
    });
  });
});
