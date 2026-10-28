import ClearStatisticsConfirmModalController from '../../../../../../../../../../assets/js/components/resources/staff_dashboard/pages/elements/controllers/ClearStatisticsConfirmModalController.js';

describe('ClearStatisticsConfirmModalController', function() {
  let setValue;
  let onConfirm;
  let onCancel;
  let controller;

  beforeEach(function() {
    setValue = jasmine.createSpy('setValue');
    onConfirm = jasmine.createSpy('onConfirm');
    onCancel = jasmine.createSpy('onCancel');
    controller = new ClearStatisticsConfirmModalController(setValue, { onConfirm, onCancel });
  });

  describe('.canConfirm', function() {
    ['', 'DELETE', 'clear', 'Clear', 'CLEARED'].forEach((value) => {
      it(`rejects "${value}"`, function() {
        expect(ClearStatisticsConfirmModalController.canConfirm(value)).toBeFalse();
      });
    });

    ['CLEAR', '  CLEAR  '].forEach((value) => {
      it(`accepts "${value}"`, function() {
        expect(ClearStatisticsConfirmModalController.canConfirm(value)).toBeTrue();
      });
    });
  });

  describe('#change', function() {
    it('stores the typed value', function() {
      controller.change({ target: { value: 'CL' } });

      expect(setValue).toHaveBeenCalledWith('CL');
    });
  });

  describe('#cancel', function() {
    it('resets the input before calling onCancel', function() {
      controller.cancel();

      expect(setValue).toHaveBeenCalledWith('');
      expect(setValue).toHaveBeenCalledBefore(onCancel);
      expect(onConfirm).not.toHaveBeenCalled();
    });
  });

  describe('#confirm', function() {
    it('resets the input before calling onConfirm', function() {
      controller.confirm();

      expect(setValue).toHaveBeenCalledWith('');
      expect(setValue).toHaveBeenCalledBefore(onConfirm);
      expect(onCancel).not.toHaveBeenCalled();
    });
  });
});
