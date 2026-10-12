import buildStaffCopiesHandlers, {
  needsConfirmation,
} from '../../../../../../../../assets/js/components/resources/staff_copy/pages/hooks/buildStaffCopiesHandlers.js';

describe('buildStaffCopiesHandlers', function() {
  let controller;
  let setPendingCopy;
  let selection;

  const build = (selectedRows, pendingCopy = null) => buildStaffCopiesHandlers({
    controller, selection: { ...selection, selectedRows }, pendingCopy, setPendingCopy,
  });

  beforeEach(function() {
    controller = jasmine.createSpyObj('controller', ['changeSelection', 'runCopy']);
    controller.links = jasmine.createSpyObj('links', ['retry']);
    setPendingCopy = jasmine.createSpy('setPendingCopy');
    selection = { onToggle: jasmine.createSpy('onToggle'), onToggleAll: jasmine.createSpy('onToggleAll') };
  });

  describe('needsConfirmation', function() {
    it('is true when a row was already copied', function() {
      expect(needsConfirmation([{ copied_to_target: false }, { copied_to_target: true }])).toBe(true);
    });

    it('is false otherwise', function() {
      expect(needsConfirmation([{ copied_to_target: false }, {}])).toBe(false);
    });
  });

  it('forwards selector changes and selection toggles', function() {
    const { page } = build([]);

    page.onSelectGame('from', 'a');

    expect(controller.changeSelection).toHaveBeenCalledWith('from', 'a');
    expect(page.onToggle).toBe(selection.onToggle);
    expect(page.onToggleAll).toBe(selection.onToggleAll);
  });

  it('retries a link through the links controller', function() {
    const link = { upload_id: 4 };

    build([]).page.onRetry(link);

    expect(controller.links.retry).toHaveBeenCalledWith(link);
  });

  it('runs right away when no row was copied before (no confirmation)', function() {
    const rows = [{ id: 1, copied_to_target: false }];

    build(rows).page.onCopy();

    expect(controller.runCopy).toHaveBeenCalledWith(rows);
    expect(setPendingCopy).not.toHaveBeenCalled();
  });

  it('asks for confirmation when some row was already copied', function() {
    const rows = [{ id: 1, copied_to_target: true }];

    build(rows).page.onCopy();

    expect(setPendingCopy).toHaveBeenCalledWith(rows);
    expect(controller.runCopy).not.toHaveBeenCalled();
  });

  it('runs the pending rows on confirm', function() {
    const rows = [{ id: 1, copied_to_target: true }];

    build([], rows).modal.onConfirm();

    expect(setPendingCopy).toHaveBeenCalledWith(null);
    expect(controller.runCopy).toHaveBeenCalledWith(rows);
  });

  it('aborts the whole run on cancel', function() {
    build([], [{ id: 1 }]).modal.onCancel();

    expect(setPendingCopy).toHaveBeenCalledWith(null);
    expect(controller.runCopy).not.toHaveBeenCalled();
  });
});
