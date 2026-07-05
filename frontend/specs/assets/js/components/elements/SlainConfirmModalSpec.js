import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import SlainConfirmModal from '../../../../../assets/js/components/elements/SlainConfirmModal.jsx';
import SlainConfirmModalHelper from '../../../../../assets/js/components/elements/helpers/SlainConfirmModalHelper.jsx';

describe('SlainConfirmModal', function() {
  it('delegates rendering to SlainConfirmModalHelper with the given show/slain state', function() {
    spyOn(SlainConfirmModalHelper, 'render').and.returnValue(
      React.createElement('div', null, 'modal')
    );

    const onConfirm = jasmine.createSpy('onConfirm');
    const onCancel = jasmine.createSpy('onCancel');

    renderToStaticMarkup(
      React.createElement(SlainConfirmModal, {
        show: true,
        slain: false,
        onConfirm,
        onCancel,
      })
    );

    expect(SlainConfirmModalHelper.render).toHaveBeenCalledWith(
      true,
      false,
      jasmine.objectContaining({ onConfirm, onCancel }),
    );
  });

  it('forwards the slain state as-is to the helper', function() {
    spyOn(SlainConfirmModalHelper, 'render').and.returnValue(
      React.createElement('div', null, 'modal')
    );

    renderToStaticMarkup(
      React.createElement(SlainConfirmModal, {
        show: false,
        slain: true,
        onConfirm: jasmine.createSpy('onConfirm'),
        onCancel: jasmine.createSpy('onCancel'),
      })
    );

    expect(SlainConfirmModalHelper.render).toHaveBeenCalledWith(
      false,
      true,
      jasmine.any(Object),
    );
  });
});
