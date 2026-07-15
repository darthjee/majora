import PollFiltersController
  from '../../../../../../../../../assets/js/components/resources/game/pages/elements/controllers/PollFiltersController.js';

describe('PollFiltersController', function() {
  describe('#handleStatusChange', function() {
    it('sets the draft status', function() {
      const setStatus = jasmine.createSpy('setStatus');
      const controller = new PollFiltersController(setStatus);

      controller.handleStatusChange('open');

      expect(setStatus).toHaveBeenCalledWith('open');
    });
  });

  describe('#buildQuery', function() {
    const controller = new PollFiltersController(jasmine.createSpy());

    it('omits status when blank', function() {
      expect(controller.buildQuery('')).toEqual({});
    });

    it('includes status when not blank', function() {
      expect(controller.buildQuery('open')).toEqual({ status: 'open' });
    });
  });

  describe('#clear', function() {
    it('resets the draft status to blank', function() {
      const setStatus = jasmine.createSpy('setStatus');
      const controller = new PollFiltersController(setStatus);

      controller.clear();

      expect(setStatus).toHaveBeenCalledWith('');
    });
  });
});
