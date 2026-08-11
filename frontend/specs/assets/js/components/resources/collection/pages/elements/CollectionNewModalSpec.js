import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import CollectionNewModal
  from '../../../../../../../../assets/js/components/resources/collection/pages/elements/CollectionNewModal.jsx';
import CollectionNewController
  from '../../../../../../../../assets/js/components/resources/collection/pages/controllers/CollectionNewController.js';
import CollectionNewModalHelper
  from '../../../../../../../../assets/js/components/resources/collection/pages/elements/helpers/CollectionNewModalHelper.jsx';
import PhotoUploadModalHelper
  from '../../../../../../../../assets/js/components/common/modals/helpers/PhotoUploadModalHelper.jsx';
import Noop from '../../../../../../../../assets/js/utils/Noop.js';

describe('CollectionNewModal', function() {
  const buildProps = (overrides = {}) => ({
    show: true,
    onClose: Noop.noop,
    onSuccess: Noop.noop,
    ...overrides,
  });

  it('renders through CollectionNewModalHelper.render with the show flag and the initial idle form state', function() {
    const renderSpy = spyOn(CollectionNewModalHelper, 'render').and.callThrough();

    renderToStaticMarkup(React.createElement(CollectionNewModal, buildProps({ show: true })));

    expect(renderSpy).toHaveBeenCalledWith(
      true,
      {
        name: '', url: '', status: 'idle', fieldErrors: {}, photoPreviewUrl: null,
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

    renderToStaticMarkup(React.createElement(CollectionNewModal, buildProps()));

    expect(capturedState.deferred).toBe(true);
  });

  it('renders the photo upload modal initially closed', function() {
    let capturedShow;
    spyOn(PhotoUploadModalHelper, 'render').and.callFake((show) => {
      capturedShow = show;
      return null;
    });

    renderToStaticMarkup(React.createElement(CollectionNewModal, buildProps()));

    expect(capturedShow).toBe(false);
  });

  it('opens the upload modal via onOpenUploadModal without throwing', function() {
    let capturedHandlers;
    spyOn(CollectionNewModalHelper, 'render').and.callFake((show, state, handlers) => {
      capturedHandlers = handlers;
      return null;
    });

    renderToStaticMarkup(React.createElement(CollectionNewModal, buildProps()));

    expect(() => capturedHandlers.onOpenUploadModal()).not.toThrow();
  });

  it('wires onSubmit to controller.submitForm with the name/url/photo payload and an onSuccess setter', function() {
    let capturedHandlers;
    spyOn(CollectionNewModalHelper, 'render').and.callFake((show, state, handlers) => {
      capturedHandlers = handlers;
      return null;
    });
    spyOn(CollectionNewController.prototype, 'submitForm').and.returnValue(Promise.resolve());

    renderToStaticMarkup(React.createElement(CollectionNewModal, buildProps()));
    const event = jasmine.createSpyObj('event', ['preventDefault']);
    capturedHandlers.onSubmit(event);

    expect(CollectionNewController.prototype.submitForm).toHaveBeenCalledWith(
      event,
      jasmine.objectContaining({ name: '', url: '', photoFile: null }),
      jasmine.objectContaining({
        setStatus: jasmine.any(Function),
        setFieldErrors: jasmine.any(Function),
        setCreatedId: jasmine.any(Function),
        onSuccess: jasmine.any(Function),
      }),
    );
  });

  it('wires onRetryPhotoUpload to controller.retryPhotoUpload with the created id, photo file, and an onSuccess setter', function() {
    let capturedHandlers;
    spyOn(CollectionNewModalHelper, 'render').and.callFake((show, state, handlers) => {
      capturedHandlers = handlers;
      return null;
    });
    spyOn(CollectionNewController.prototype, 'retryPhotoUpload').and.returnValue(Promise.resolve());

    renderToStaticMarkup(React.createElement(CollectionNewModal, buildProps()));
    capturedHandlers.onRetryPhotoUpload();

    expect(CollectionNewController.prototype.retryPhotoUpload).toHaveBeenCalledWith(
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
    spyOn(CollectionNewModalHelper, 'render').and.callFake((show, state, handlers) => {
      capturedHandlers = handlers;
      return null;
    });

    renderToStaticMarkup(React.createElement(CollectionNewModal, buildProps({ onSuccess })));
    capturedHandlers.onSkipPhotoUpload();

    expect(onSuccess).toHaveBeenCalled();
  });

  it('calls onClose when the modal is dismissed', function() {
    let capturedHandlers;
    const onClose = jasmine.createSpy('onClose');
    spyOn(CollectionNewModalHelper, 'render').and.callFake((show, state, handlers) => {
      capturedHandlers = handlers;
      return null;
    });

    renderToStaticMarkup(React.createElement(CollectionNewModal, buildProps({ onClose })));
    capturedHandlers.onClose();

    expect(onClose).toHaveBeenCalled();
  });

  it('passes the show prop through to the helper', function() {
    let capturedShow;
    spyOn(CollectionNewModalHelper, 'render').and.callFake((show) => {
      capturedShow = show;
      return null;
    });

    renderToStaticMarkup(React.createElement(CollectionNewModal, buildProps({ show: false })));

    expect(capturedShow).toBe(false);
  });
});
