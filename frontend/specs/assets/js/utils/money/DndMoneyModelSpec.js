import DndMoneyModel from '../../../../../assets/js/utils/money/DndMoneyModel.js';
import MoneyModelRegistry from '../../../../../assets/js/utils/money/MoneyModelRegistry.js';

describe('DndMoneyModel', function() {
  describe('.transform', function() {
    it('registers itself under "dnd" on the money model registry', function() {
      expect(MoneyModelRegistry.resolve('dnd')).toBe(DndMoneyModel);
    });

    it('throws for an unrecognized context', function() {
      expect(() => DndMoneyModel.transform(100, { context: 'unknown' }))
        .toThrowError('Unknown dnd money context: unknown');
    });

    it('throws when no context is given', function() {
      expect(() => DndMoneyModel.transform(100))
        .toThrowError('Unknown dnd money context: undefined');
    });

    describe('with the "character" context', function() {
      it('returns an empty array for 0', function() {
        expect(DndMoneyModel.transform(0, { context: 'character' })).toEqual([]);
      });

      it('cascades copper into silver, gold and platinum at the threshold of 30', function() {
        expect(DndMoneyModel.transform(332, { context: 'character' })).toEqual([
          { key: 'cp', quantity: 22 },
          { key: 'sp', quantity: 21 },
          { key: 'gp', quantity: 1 },
        ]);
      });

      it('overflows into gems once platinum absorbs its cascade threshold', function() {
        expect(DndMoneyModel.transform(32221, { context: 'character' })).toEqual([
          { key: 'cp', quantity: 21 },
          { key: 'sp', quantity: 20 },
          { key: 'gp', quantity: 20 },
          { key: 'pp', quantity: 20 },
          { key: 'gems', quantity: 100 },
        ]);
      });
    });

    describe('with the "treasure" context', function() {
      it('returns an empty array for 0', function() {
        expect(DndMoneyModel.transform(0, { context: 'treasure' })).toEqual([]);
      });

      it('caps at gold, absorbing all remaining value, at the threshold of 10', function() {
        expect(DndMoneyModel.transform(100052, { context: 'treasure' })).toEqual([
          { key: 'cp', quantity: 2 },
          { key: 'sp', quantity: 5 },
          { key: 'gp', quantity: 1000 },
        ]);
      });

      it('does not overflow into gems even when a lot of value remains', function() {
        expect(DndMoneyModel.transform(100000000, { context: 'treasure' })).toEqual([
          { key: 'gp', quantity: 1000000 },
        ]);
      });
    });
  });

  describe('.pack', function() {
    it('throws for an unrecognized context', function() {
      expect(() => DndMoneyModel.pack({}, { context: 'unknown' }))
        .toThrowError('Unknown dnd money context: unknown');
    });

    it('throws when no context is given', function() {
      expect(() => DndMoneyModel.pack({}))
        .toThrowError('Unknown dnd money context: undefined');
    });

    describe('with the "character" context', function() {
      it('sums copper, silver, gold, platinum and gems weighted by their relative value', function() {
        expect(DndMoneyModel.pack({
          cp: 2, sp: 3, gp: 4, pp: 5, gems: 6,
        }, { context: 'character' })).toBe(2 + 30 + 400 + 5000 + 600);
      });

      it('round-trips with .transform for a representative total', function() {
        const breakdown = DndMoneyModel.transform(32221, { context: 'character' })
          .reduce((acc, entry) => ({ ...acc, [entry.key]: entry.quantity }), {});

        expect(DndMoneyModel.pack(breakdown, { context: 'character' })).toBe(32221);
      });
    });

    describe('with the "treasure" context', function() {
      it('does not add a gems term', function() {
        expect(DndMoneyModel.pack({
          cp: 2, sp: 5, gp: 1000, gems: 99,
        }, { context: 'treasure' })).toBe(100052);
      });

      it('round-trips with .transform for a representative total', function() {
        const breakdown = DndMoneyModel.transform(100052, { context: 'treasure' })
          .reduce((acc, entry) => ({ ...acc, [entry.key]: entry.quantity }), {});

        expect(DndMoneyModel.pack(breakdown, { context: 'treasure' })).toBe(100052);
      });
    });
  });

  describe('.denominationKeys', function() {
    it('returns the 5 character denomination keys', function() {
      expect(DndMoneyModel.denominationKeys('character')).toEqual(['cp', 'sp', 'gp', 'pp', 'gems']);
    });

    it('returns the 3 treasure denomination keys', function() {
      expect(DndMoneyModel.denominationKeys('treasure')).toEqual(['cp', 'sp', 'gp']);
    });

    it('throws for an unrecognized context', function() {
      expect(() => DndMoneyModel.denominationKeys('unknown'))
        .toThrowError('Unknown dnd money context: unknown');
    });
  });

  describe('.labelKey', function() {
    it('resolves the abbreviation translation key for each coin denomination', function() {
      expect(DndMoneyModel.labelKey('cp')).toBe('money.cp_abbreviation');
      expect(DndMoneyModel.labelKey('sp')).toBe('money.sp_abbreviation');
      expect(DndMoneyModel.labelKey('gp')).toBe('money.gp_abbreviation');
      expect(DndMoneyModel.labelKey('pp')).toBe('money.pp_abbreviation');
    });

    it('resolves the gems overflow translation key', function() {
      expect(DndMoneyModel.labelKey('gems')).toBe('money.gp_in_gems');
    });
  });
});
