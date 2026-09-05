import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import RecoveryTokenActionConfirmModal from '../../../../../../../../assets/js/components/resources/staff_user/pages/elements/RecoveryTokenActionConfirmModal.jsx';
import RecoveryTokenActionConfirmModalHelper from '../../../../../../../../assets/js/components/resources/staff_user/pages/elements/helpers/RecoveryTokenActionConfirmModalHelper.jsx';

describe('RecoveryTokenActionConfirmModal', function() {
  it('delegates rendering to RecoveryTokenActionConfirmModalHelper with the given show/action state', function() {
    spyOn(RecoveryTokenActionConfirmModalHelper, 'render').and.returnValue(
      React.createElement('div', null, 'modal')
    );

    const onConfirm = jasmine.createSpy('onConfirm');
    const onCancel = jasmine.createSpy('onCancel');

    renderToStaticMarkup(
      React.createElement(RecoveryTokenActionConfirmModal, {
        show: true,
        action: 'delete',
        onConfirm,
        onCancel,
      })
    );

    expect(RecoveryTokenActionConfirmModalHelper.render).toHaveBeenCalledWith(
      true,
      'delete',
      jasmine.objectContaining({ onConfirm, onCancel }),
    );
  });

  it('forwards the force-expire action and a false show flag as-is to the helper', function() {
    spyOn(RecoveryTokenActionConfirmModalHelper, 'render').and.returnValue(
      React.createElement('div', null, 'modal')
    );

    renderToStaticMarkup(
      React.createElement(RecoveryTokenActionConfirmModal, {
        show: false,
        action: 'force-expire',
        onConfirm: jasmine.createSpy('onConfirm'),
        onCancel: jasmine.createSpy('onCancel'),
      })
    );

    expect(RecoveryTokenActionConfirmModalHelper.render).toHaveBeenCalledWith(
      false, 'force-expire', jasmine.any(Object),
    );
  });
});
