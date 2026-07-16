import GamePollController
  from '../../../../../../../../../assets/js/components/resources/game/pages/controllers/GamePollController.js';

describe('GamePollController', function() {
  describe('.toggleSelection', function() {
    it('replaces the selection outright for a single-type poll', function() {
      const result = GamePollController.toggleSelection('single', 11, [10]);

      expect(result).toEqual([11]);
    });

    it('adds the option id for a multiple-type poll when not yet selected', function() {
      const result = GamePollController.toggleSelection('multiple', 11, [10]);

      expect(result).toEqual([10, 11]);
    });

    it('removes the option id for a multiple-type poll when already selected', function() {
      const result = GamePollController.toggleSelection('multiple', 10, [10, 11]);

      expect(result).toEqual([11]);
    });
  });
});
