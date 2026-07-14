import MoneyEditModalController
  from '../../../../../../assets/js/components/common/controllers/MoneyEditModalController.js';

describe('MoneyEditModalController', function() {
  describe('.denominationKeys', function() {
    it('returns the 5 character denomination keys by default', function() {
      expect(MoneyEditModalController.denominationKeys()).toEqual(['cp', 'sp', 'gp', 'pp', 'gems']);
    });

    it('returns the 5 character denomination keys for the character context', function() {
      expect(MoneyEditModalController.denominationKeys('character')).toEqual(['cp', 'sp', 'gp', 'pp', 'gems']);
    });

    it('returns only cp/sp/gp for the treasure context', function() {
      expect(MoneyEditModalController.denominationKeys('treasure')).toEqual(['cp', 'sp', 'gp']);
    });
  });

  describe('.seedBreakdown', function() {
    it('returns a dense breakdown with zeros for a money value of 0', function() {
      expect(MoneyEditModalController.seedBreakdown(0)).toEqual({
        cp: 0, sp: 0, gp: 0, pp: 0, gems: 0,
      });
    });

    it('returns a dense breakdown for a mixed money total', function() {
      expect(MoneyEditModalController.seedBreakdown(332)).toEqual({
        cp: 22, sp: 21, gp: 1, pp: 0, gems: 0,
      });
    });

    it('accepts a string money value', function() {
      expect(MoneyEditModalController.seedBreakdown('332')).toEqual({
        cp: 22, sp: 21, gp: 1, pp: 0, gems: 0,
      });
    });

    it('treats a non-numeric money value as 0', function() {
      expect(MoneyEditModalController.seedBreakdown('not-a-number')).toEqual({
        cp: 0, sp: 0, gp: 0, pp: 0, gems: 0,
      });
    });

    it('includes a gems entry when the total overflows into gems', function() {
      expect(MoneyEditModalController.seedBreakdown(32221)).toEqual({
        cp: 21, sp: 20, gp: 20, pp: 20, gems: 100,
      });
    });

    it('returns a dense cp/sp/gp-only breakdown for the treasure context', function() {
      expect(MoneyEditModalController.seedBreakdown(332, 'treasure')).toEqual({ cp: 2, sp: 3, gp: 3 });
    });

    it('returns a zeroed cp/sp/gp breakdown for a treasure money value of 0', function() {
      expect(MoneyEditModalController.seedBreakdown(0, 'treasure')).toEqual({ cp: 0, sp: 0, gp: 0 });
    });
  });

  describe('.updateField', function() {
    it('merges the given field change into the breakdown', function() {
      const breakdown = {
        cp: 1, sp: 2, gp: 3, pp: 4, gems: 5,
      };

      const result = MoneyEditModalController.updateField(breakdown, 'gp', 10);

      expect(result).toEqual({
        cp: 1, sp: 2, gp: 10, pp: 4, gems: 5,
      });
    });

    it('does not mutate the given breakdown', function() {
      const breakdown = {
        cp: 1, sp: 2, gp: 3, pp: 4, gems: 5,
      };

      MoneyEditModalController.updateField(breakdown, 'gp', 10);

      expect(breakdown.gp).toBe(3);
    });
  });

  describe('.canConfirm', function() {
    it('is true when every denomination is a non-negative integer', function() {
      const breakdown = {
        cp: 1, sp: 2, gp: 3, pp: 4, gems: 0,
      };

      expect(MoneyEditModalController.canConfirm(breakdown)).toBe(true);
    });

    it('is false when a denomination is negative', function() {
      const breakdown = {
        cp: -1, sp: 2, gp: 3, pp: 4, gems: 0,
      };

      expect(MoneyEditModalController.canConfirm(breakdown)).toBe(false);
    });

    it('is false when a denomination is not an integer', function() {
      const breakdown = {
        cp: 1.5, sp: 2, gp: 3, pp: 4, gems: 0,
      };

      expect(MoneyEditModalController.canConfirm(breakdown)).toBe(false);
    });

    it('is false when a denomination is NaN', function() {
      const breakdown = {
        cp: NaN, sp: 2, gp: 3, pp: 4, gems: 0,
      };

      expect(MoneyEditModalController.canConfirm(breakdown)).toBe(false);
    });

    it('ignores pp/gems for the treasure context', function() {
      const breakdown = { cp: 1, sp: 2, gp: 3 };

      expect(MoneyEditModalController.canConfirm(breakdown, 'treasure')).toBe(true);
    });

    it('is false for the treasure context when cp/sp/gp is not a non-negative integer', function() {
      const breakdown = { cp: -1, sp: 2, gp: 3 };

      expect(MoneyEditModalController.canConfirm(breakdown, 'treasure')).toBe(false);
    });
  });

  describe('.computeTotal', function() {
    it('sums copper, silver, gold, platinum and gems weighted by their relative value', function() {
      const breakdown = {
        cp: 2, sp: 3, gp: 4, pp: 5, gems: 6,
      };

      expect(MoneyEditModalController.computeTotal(breakdown)).toBe(2 + 30 + 400 + 5000 + 600);
    });

    it('round-trips with .seedBreakdown for a representative total', function() {
      const breakdown = MoneyEditModalController.seedBreakdown(32221);

      expect(MoneyEditModalController.computeTotal(breakdown)).toBe(32221);
    });

    it('sums copper, silver and gold for the treasure context', function() {
      const breakdown = { cp: 2, sp: 3, gp: 4 };

      expect(MoneyEditModalController.computeTotal(breakdown, 'treasure')).toBe(2 + 30 + 400);
    });

    it('round-trips with .seedBreakdown for the treasure context', function() {
      const breakdown = MoneyEditModalController.seedBreakdown(332, 'treasure');

      expect(MoneyEditModalController.computeTotal(breakdown, 'treasure')).toBe(332);
    });
  });
});
