import { buildContext, buildHeaderController } from './support.js';

describe('HeaderController', function() {
  let controller;

  beforeEach(function() {
    controller = buildHeaderController(buildContext());
  });

  describe('#handleViewAsClick', function() {
    it('prevents the default link navigation', function() {
      const event = { preventDefault: jasmine.createSpy('preventDefault') };

      controller.handleViewAsClick(event, jasmine.createSpy('onViewAsClick'));

      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('delegates to the given view-as click handler', function() {
      const event = { preventDefault: jasmine.createSpy('preventDefault') };
      const onViewAsClick = jasmine.createSpy('onViewAsClick');

      controller.handleViewAsClick(event, onViewAsClick);

      expect(onViewAsClick).toHaveBeenCalled();
    });
  });
});
