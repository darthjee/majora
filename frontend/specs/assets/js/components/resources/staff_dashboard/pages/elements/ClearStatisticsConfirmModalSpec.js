import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ClearStatisticsConfirmModal from '../../../../../../../../assets/js/components/resources/staff_dashboard/pages/elements/ClearStatisticsConfirmModal.jsx';
import ClearStatisticsConfirmModalController from '../../../../../../../../assets/js/components/resources/staff_dashboard/pages/elements/controllers/ClearStatisticsConfirmModalController.js';
import ClearStatisticsConfirmModalHelper from '../../../../../../../../assets/js/components/resources/staff_dashboard/pages/elements/helpers/ClearStatisticsConfirmModalHelper.jsx';

describe('ClearStatisticsConfirmModal', function() {
  let onConfirm;
  let onCancel;

  const renderModal = (show = true) => {
    renderToStaticMarkup(React.createElement(ClearStatisticsConfirmModal, { show, onConfirm, onCancel }));

    return ClearStatisticsConfirmModalHelper.render.calls.mostRecent().args;
  };

  beforeEach(function() {
    onConfirm = jasmine.createSpy('onConfirm');
    onCancel = jasmine.createSpy('onCancel');
    spyOn(ClearStatisticsConfirmModalHelper, 'render').and.returnValue(React.createElement('div', null, 'modal'));
  });

  it('starts with an empty input and confirm disabled', function() {
    const [show, state] = renderModal();

    expect(show).toBeTrue();
    expect(state).toEqual({ value: '', canConfirm: false });
  });

  it('forwards a false show flag as-is', function() {
    const [show] = renderModal(false);

    expect(show).toBeFalse();
  });

  it('routes the input change to the controller', function() {
    const changeSpy = spyOn(ClearStatisticsConfirmModalController.prototype, 'change');
    const [, , handlers] = renderModal();
    const event = { target: { value: 'CLEAR' } };

    handlers.onChange(event);

    expect(changeSpy).toHaveBeenCalledWith(event);
  });

  it('calls onCancel when cancelling', function() {
    const [, , handlers] = renderModal();

    handlers.onCancel();

    expect(onCancel).toHaveBeenCalled();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('calls onConfirm when confirming', function() {
    const [, , handlers] = renderModal();

    handlers.onConfirm();

    expect(onConfirm).toHaveBeenCalled();
    expect(onCancel).not.toHaveBeenCalled();
  });
});
