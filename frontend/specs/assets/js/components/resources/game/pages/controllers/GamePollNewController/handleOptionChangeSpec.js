import GamePollNewController
  from '../../../../../../../../../assets/js/components/resources/game/pages/controllers/GamePollNewController.js';

describe('GamePollNewController', function() {
  describe('.handleOptionChange', function() {
    it('updates the edited option value', function() {
      const setOptions = jasmine.createSpy('setOptions');

      GamePollNewController.handleOptionChange(0, 'Griffin', ['', 'Second'], setOptions);

      expect(setOptions).toHaveBeenCalledWith(['Griffin', 'Second']);
    });

    it('appends a new blank entry when editing the last (blank) option to a non-blank value', function() {
      const setOptions = jasmine.createSpy('setOptions');

      GamePollNewController.handleOptionChange(0, 'Griffin', [''], setOptions);

      expect(setOptions).toHaveBeenCalledWith(['Griffin', '']);
    });

    it('does not append a new entry when editing a non-last option', function() {
      const setOptions = jasmine.createSpy('setOptions');

      GamePollNewController.handleOptionChange(0, 'Griffin', ['', ''], setOptions);

      expect(setOptions).toHaveBeenCalledWith(['Griffin', '']);
    });

    it('does not append a new entry when the edited last option becomes blank', function() {
      const setOptions = jasmine.createSpy('setOptions');

      GamePollNewController.handleOptionChange(0, '', ['Griffin'], setOptions);

      expect(setOptions).toHaveBeenCalledWith(['']);
    });

    it('does not append a new entry when editing the last option to only whitespace', function() {
      const setOptions = jasmine.createSpy('setOptions');

      GamePollNewController.handleOptionChange(0, '   ', [''], setOptions);

      expect(setOptions).toHaveBeenCalledWith(['   ']);
    });
  });
});
