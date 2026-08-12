import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import FactionNewModal
  from '../../../../../../../../assets/js/components/resources/faction/pages/elements/FactionNewModal.jsx';
import FactionNewController
  from '../../../../../../../../assets/js/components/resources/faction/pages/controllers/FactionNewController.js';
import FactionNewModalHelper
  from '../../../../../../../../assets/js/components/resources/faction/pages/elements/helpers/FactionNewModalHelper.jsx';
import PhotoUploadModalHelper
  from '../../../../../../../../assets/js/components/common/modals/helpers/PhotoUploadModalHelper.jsx';
import Noop from '../../../../../../../../assets/js/utils/Noop.js';

describe('FactionNewModal', function() {
  const buildProps = (overrides = {}) => ({
    show: true,
    gameSlug: 'demo',
    onClose: Noop.noop,
    onSuccess: Noop.noop,
    ...overrides,
  });

  it('renders through FactionNewModalHelper.render with the show flag and the initial idle form state', function() {
    const renderSpy = spyOn(FactionNewModalHelper, 'render').and.callThrough();

    renderToStaticMarkup(React.createElement(FactionNewModal, buildProps({ show: true })));

    expect(renderSpy).toHaveBeenCalledWith(
      true,
      {
        name: '', status: 'idle', fieldErrors: {}, photoPreviewUrl: null,
      },
      jasmine.any(Object),
    );
  });

  it('renders the photo upload modal in deferred mode', function() {
    let capturedState;
    spyOn(PhotoUploadModalHelper, 'render').and.callFake((show, state) => {
      capturedState = state;
      return null;
    });

    renderToStaticMarkup(React.createElement(FactionNewModal, buildProps()));

    expect(capturedState.deferred).toBe(true);
  });

  it('renders the photo upload modal initially closed', function() {
    let capturedShow;
    spyOn(PhotoUploadModalHelper, 'render').and.callFake((show) => {
      capturedShow = show;
      return null;
    });

    renderToStaticMarkup(React.createElement(FactionNewModal, buildProps()));

    expect(capturedShow).toBe(false);
  });

  it('opens the upload modal via onOpenUploadModal without throwing', function() {
    let capturedHandlers;
    spyOn(FactionNewModalHelper, 'render').and.callFake((show, state, handlers) => {
      capturedHandlers = handlers;
      return null;
    });

    renderToStaticMarkup(React.createElement(FactionNewModal, buildProps()));

    expect(() => capturedHandlers.onOpenUploadModal()).not.toThrow();
  });

  it('wires onSubmit to controller.submitForm with the gameSlug, name/photo payload and an onSuccess setter', function() {
    let capturedHandlers;
    spyOn(FactionNewModalHelper, 'render').and.callFake((show, state, handlers) => {
      capturedHandlers = handlers;
      return null;
    });
    spyOn(FactionNewController.prototype, 'submitForm').and.returnValue(Promise.resolve());

    renderToStaticMarkup(React.createElement(FactionNewModal, buildProps({ gameSlug: 'demo' })));
    const event = jasmine.createSpyObj('event', ['preventDefault']);
    capturedHandlers.onSubmit(event);

    expect(FactionNewController.prototype.submitForm).toHaveBeenCalledWith(
      event,
      'demo',
      jasmine.objectContaining({ name: '', photoFile: null }),
      jasmine.objectContaining({
        setStatus: jasmine.any(Function),
        setFieldErrors: jasmine.any(Function),
        setCreatedId: jasmine.any(Function),
        onSuccess: jasmine.any(Function),
      }),
    );
  });

  it('wires onRetryPhotoUpload to controller.retryPhotoUpload with the game slug, created id, photo file, and an onSuccess setter', function() {
    let capturedHandlers;
    spyOn(FactionNewModalHelper, 'render').and.callFake((show, state, handlers) => {
      capturedHandlers = handlers;
      return null;
    });
    spyOn(FactionNewController.prototype, 'retryPhotoUpload').and.returnValue(Promise.resolve());

    renderToStaticMarkup(React.createElement(FactionNewModal, buildProps({ gameSlug: 'demo' })));
    capturedHandlers.onRetryPhotoUpload();

    expect(FactionNewController.prototype.retryPhotoUpload).toHaveBeenCalledWith(
      'demo',
      null,
      null,
      jasmine.objectContaining({
        setStatus: jasmine.any(Function),
        setCreatedId: jasmine.any(Function),
        onSuccess: jasmine.any(Function),
      }),
    );
  });

  it('calls onSuccess (closing the modal and reloading the list) when the skip-photo-upload action is used', function() {
    let capturedHandlers;
    const onSuccess = jasmine.createSpy('onSuccess');
    spyOn(FactionNewModalHelper, 'render').and.callFake((show, state, handlers) => {
      capturedHandlers = handlers;
      return null;
    });

    renderToStaticMarkup(React.createElement(FactionNewModal, buildProps({ onSuccess })));
    capturedHandlers.onSkipPhotoUpload();

    expect(onSuccess).toHaveBeenCalled();
  });

  it('calls onClose when the modal is dismissed', function() {
    let capturedHandlers;
    const onClose = jasmine.createSpy('onClose');
    spyOn(FactionNewModalHelper, 'render').and.callFake((show, state, handlers) => {
      capturedHandlers = handlers;
      return null;
    });

    renderToStaticMarkup(React.createElement(FactionNewModal, buildProps({ onClose })));
    capturedHandlers.onClose();

    expect(onClose).toHaveBeenCalled();
  });

  it('passes the show prop through to the helper', function() {
    let capturedShow;
    spyOn(FactionNewModalHelper, 'render').and.callFake((show) => {
      capturedShow = show;
      return null;
    });

    renderToStaticMarkup(React.createElement(FactionNewModal, buildProps({ show: false })));

    expect(capturedShow).toBe(false);
  });
});
