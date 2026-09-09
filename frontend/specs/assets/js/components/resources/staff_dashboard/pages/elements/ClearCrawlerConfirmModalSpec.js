import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ClearCrawlerConfirmModal from '../../../../../../../../assets/js/components/resources/staff_dashboard/pages/elements/ClearCrawlerConfirmModal.jsx';
import ClearCrawlerConfirmModalHelper from '../../../../../../../../assets/js/components/resources/staff_dashboard/pages/elements/helpers/ClearCrawlerConfirmModalHelper.jsx';

describe('ClearCrawlerConfirmModal', function() {
  it('delegates rendering to ClearCrawlerConfirmModalHelper with the given show state', function() {
    spyOn(ClearCrawlerConfirmModalHelper, 'render').and.returnValue(
      React.createElement('div', null, 'modal')
    );

    const onConfirm = jasmine.createSpy('onConfirm');
    const onCancel = jasmine.createSpy('onCancel');

    renderToStaticMarkup(
      React.createElement(ClearCrawlerConfirmModal, {
        show: true,
        onConfirm,
        onCancel,
      })
    );

    expect(ClearCrawlerConfirmModalHelper.render).toHaveBeenCalledWith(
      true,
      jasmine.objectContaining({ onConfirm, onCancel }),
    );
  });

  it('forwards a false show flag as-is to the helper', function() {
    spyOn(ClearCrawlerConfirmModalHelper, 'render').and.returnValue(
      React.createElement('div', null, 'modal')
    );

    renderToStaticMarkup(
      React.createElement(ClearCrawlerConfirmModal, {
        show: false,
        onConfirm: jasmine.createSpy('onConfirm'),
        onCancel: jasmine.createSpy('onCancel'),
      })
    );

    expect(ClearCrawlerConfirmModalHelper.render).toHaveBeenCalledWith(
      false, jasmine.any(Object),
    );
  });
});
