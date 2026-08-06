import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ClearCacheConfirmModal from '../../../../../../../../assets/js/components/resources/staff_dashboard/pages/elements/ClearCacheConfirmModal.jsx';
import ClearCacheConfirmModalHelper from '../../../../../../../../assets/js/components/resources/staff_dashboard/pages/elements/helpers/ClearCacheConfirmModalHelper.jsx';

describe('ClearCacheConfirmModal', function() {
  it('delegates rendering to ClearCacheConfirmModalHelper with the given show state', function() {
    spyOn(ClearCacheConfirmModalHelper, 'render').and.returnValue(
      React.createElement('div', null, 'modal')
    );

    const onConfirm = jasmine.createSpy('onConfirm');
    const onCancel = jasmine.createSpy('onCancel');

    renderToStaticMarkup(
      React.createElement(ClearCacheConfirmModal, {
        show: true,
        onConfirm,
        onCancel,
      })
    );

    expect(ClearCacheConfirmModalHelper.render).toHaveBeenCalledWith(
      true,
      jasmine.objectContaining({ onConfirm, onCancel }),
    );
  });

  it('forwards a false show flag as-is to the helper', function() {
    spyOn(ClearCacheConfirmModalHelper, 'render').and.returnValue(
      React.createElement('div', null, 'modal')
    );

    renderToStaticMarkup(
      React.createElement(ClearCacheConfirmModal, {
        show: false,
        onConfirm: jasmine.createSpy('onConfirm'),
        onCancel: jasmine.createSpy('onCancel'),
      })
    );

    expect(ClearCacheConfirmModalHelper.render).toHaveBeenCalledWith(
      false, jasmine.any(Object),
    );
  });
});
