import GamePollNewController
  from '../../../../../../../../../assets/js/components/resources/game/pages/controllers/GamePollNewController.js';

describe('GamePollNewController', function() {
  describe('.handleOptionRemove', function() {
    it('removes the option at the given index', function() {
      const setOptions = jasmine.createSpy('setOptions');

      GamePollNewController.handleOptionRemove(1, ['Griffin', 'Anchor', ''], setOptions);

      expect(setOptions).toHaveBeenCalledWith(['Griffin', '']);
    });
  });
});
