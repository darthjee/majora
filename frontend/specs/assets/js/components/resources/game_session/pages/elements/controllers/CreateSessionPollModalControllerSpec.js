import CreateSessionPollModalController
  from '../../../../../../../../../assets/js/components/resources/game_session/pages/elements/controllers/CreateSessionPollModalController.js';
import GamePollNewController
  from '../../../../../../../../../assets/js/components/resources/game/pages/controllers/GamePollNewController.js';

describe('CreateSessionPollModalController', function() {
  describe('.handleDateChange', function() {
    it('delegates to GamePollNewController.handleOptionChange', function() {
      spyOn(GamePollNewController, 'handleOptionChange');
      const setDates = jasmine.createSpy('setDates');
      const dates = ['', 'Second'];

      CreateSessionPollModalController.handleDateChange(0, '2024-01-01', dates, setDates);

      expect(GamePollNewController.handleOptionChange).toHaveBeenCalledWith(0, '2024-01-01', dates, setDates);
    });
  });

  describe('.handleDateRemove', function() {
    it('delegates to GamePollNewController.handleOptionRemove', function() {
      spyOn(GamePollNewController, 'handleOptionRemove');
      const setDates = jasmine.createSpy('setDates');
      const dates = ['2024-01-01', ''];

      CreateSessionPollModalController.handleDateRemove(0, dates, setDates);

      expect(GamePollNewController.handleOptionRemove).toHaveBeenCalledWith(0, dates, setDates);
    });
  });

  describe('.nonBlankDates', function() {
    it('filters out blank entries', function() {
      expect(CreateSessionPollModalController.nonBlankDates(['2024-01-01', '', '2024-01-02']))
        .toEqual(['2024-01-01', '2024-01-02']);
    });

    it('filters out whitespace-only entries', function() {
      expect(CreateSessionPollModalController.nonBlankDates(['2024-01-01', '   ']))
        .toEqual(['2024-01-01']);
    });

    it('returns an empty array when every entry is blank', function() {
      expect(CreateSessionPollModalController.nonBlankDates([''])).toEqual([]);
    });
  });

  describe('.canConfirm', function() {
    it('is true when at least one non-blank date is present', function() {
      expect(CreateSessionPollModalController.canConfirm(['2024-01-01', ''])).toBe(true);
    });

    it('is false when every date is blank', function() {
      expect(CreateSessionPollModalController.canConfirm([''])).toBe(false);
    });

    it('is false for an empty array', function() {
      expect(CreateSessionPollModalController.canConfirm([])).toBe(false);
    });
  });
});
