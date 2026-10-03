import buildStaffPhotosHandlers, {
  confirmPending,
} from '../../../../../../../../assets/js/components/resources/staff_photo/pages/hooks/buildStaffPhotosHandlers.js';

describe('buildStaffPhotosHandlers', function() {
  let controller;
  let selection;
  let setters;
  const pending = {
    resize: { id: 1 },
    bulk: { action: 'delete', photos: [{ id: 2 }] },
    delete: { id: 3 },
    replace: { id: 4 },
  };

  beforeEach(function() {
    controller = jasmine.createSpyObj('controller', [
      'handleResize', 'runBulk', 'handleDelete', 'handleReplaceSuccess', 'handleReplaceError',
    ]);
    selection = {
      selectedPhotos: [{ id: 5 }],
      onToggle: jasmine.createSpy('onToggle'),
      onToggleAll: jasmine.createSpy('onToggleAll'),
    };
    setters = {
      setPendingResize: jasmine.createSpy('setPendingResize'),
      setPendingBulk: jasmine.createSpy('setPendingBulk'),
      setPendingDelete: jasmine.createSpy('setPendingDelete'),
      setPendingReplace: jasmine.createSpy('setPendingReplace'),
      dismissBulkResult: jasmine.createSpy('dismissBulkResult'),
    };
  });

  /**
   * @description Builds the handlers under test.
   * @returns {object} The handlers.
   */
  function build() {
    return buildStaffPhotosHandlers({
      controller, selection, pending, setters,
    });
  }

  describe('page handlers', function() {
    it('opens the single action modals', function() {
      const { page } = build();

      expect(page.onResize).toBe(setters.setPendingResize);
      expect(page.onReplace).toBe(setters.setPendingReplace);
      expect(page.onDelete).toBe(setters.setPendingDelete);
    });

    it('forwards the selection toggles and the summary dismisser', function() {
      const { page } = build();

      expect(page.onToggle).toBe(selection.onToggle);
      expect(page.onToggleAll).toBe(selection.onToggleAll);
      expect(page.onCloseSummary).toBe(setters.dismissBulkResult);
    });

    it('opens the bulk confirmation with the selected photos', function() {
      build().page.onBulk('resize');

      expect(setters.setPendingBulk).toHaveBeenCalledWith({ action: 'resize', photos: [{ id: 5 }] });
    });
  });

  describe('modal handlers', function() {
    it('confirms a single resize', function() {
      build().modals.onConfirmResize();

      expect(setters.setPendingResize).toHaveBeenCalledWith(null);
      expect(controller.handleResize).toHaveBeenCalledWith({ id: 1 });
    });

    it('confirms a bulk job', function() {
      build().modals.onConfirmBulk();

      expect(setters.setPendingBulk).toHaveBeenCalledWith(null);
      expect(controller.runBulk).toHaveBeenCalledWith('delete', [{ id: 2 }]);
    });

    it('confirms a delete', function() {
      build().modals.onConfirmDelete();

      expect(setters.setPendingDelete).toHaveBeenCalledWith(null);
      expect(controller.handleDelete).toHaveBeenCalledWith({ id: 3 });
    });

    it('handles the replace success and error', function() {
      const { modals } = build();

      modals.onReplaceSuccess();
      modals.onReplaceError(409);

      expect(setters.setPendingReplace).toHaveBeenCalledWith(null);
      expect(controller.handleReplaceSuccess).toHaveBeenCalledWith({ id: 4 });
      expect(controller.handleReplaceError).toHaveBeenCalledWith({ id: 4 }, 409);
    });
  });

  describe('confirmPending', function() {
    it('clears the pending value and returns the action result', function() {
      const setPending = jasmine.createSpy('setPending');

      expect(confirmPending(7, setPending, (value) => value * 2)()).toBe(14);
      expect(setPending).toHaveBeenCalledWith(null);
    });
  });
});
