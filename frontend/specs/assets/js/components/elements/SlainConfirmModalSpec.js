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
      false,
      jasmine.any(Object),
    );
  });

  it('defaults isPublic to false when omitted', function() {
    spyOn(SlainConfirmModalHelper, 'render').and.returnValue(
      React.createElement('div', null, 'modal')
    );

    renderToStaticMarkup(
      React.createElement(SlainConfirmModal, {
        show: true,
        slain: false,
        onConfirm: jasmine.createSpy('onConfirm'),
        onCancel: jasmine.createSpy('onCancel'),
      })
    );

    expect(SlainConfirmModalHelper.render).toHaveBeenCalledWith(
      true, false, false, jasmine.any(Object),
    );
  });

  it('forwards isPublic true to the helper when toggling the public field', function() {
    spyOn(SlainConfirmModalHelper, 'render').and.returnValue(
      React.createElement('div', null, 'modal')
    );

    renderToStaticMarkup(
      React.createElement(SlainConfirmModal, {
        show: true,
        slain: false,
        isPublic: true,
        onConfirm: jasmine.createSpy('onConfirm'),
        onCancel: jasmine.createSpy('onCancel'),
      })
    );

    expect(SlainConfirmModalHelper.render).toHaveBeenCalledWith(
      true, false, true, jasmine.any(Object),
    );
  });
});
