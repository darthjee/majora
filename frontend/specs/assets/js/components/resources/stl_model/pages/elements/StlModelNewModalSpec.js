import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import StlModelNewModal, { buildTagsAfterAdd }
  from '../../../../../../../../assets/js/components/resources/stl_model/pages/elements/StlModelNewModal.jsx';
import StlModelNewController
  from '../../../../../../../../assets/js/components/resources/stl_model/pages/controllers/StlModelNewController.js';
import StlModelNewModalHelper
  from '../../../../../../../../assets/js/components/resources/stl_model/pages/elements/helpers/StlModelNewModalHelper.jsx';
import PhotoUploadModalHelper
  from '../../../../../../../../assets/js/components/common/modals/helpers/PhotoUploadModalHelper.jsx';
import Noop from '../../../../../../../../assets/js/utils/Noop.js';

describe('buildTagsAfterAdd', function() {
  it('splits comma-separated input into trimmed pieces', function() {
    expect(buildTagsAfterAdd([], 'goblin, humanoid')).toEqual(['goblin', 'humanoid']);
  });

  it('drops blank pieces (e.g. a trailing comma)', function() {
    expect(buildTagsAfterAdd([], 'goblin,,')).toEqual(['goblin']);
  });

  it('drops pieces that case-insensitively duplicate an existing pending tag', function() {
    expect(buildTagsAfterAdd(['Goblin'], 'goblin, humanoid')).toEqual(['Goblin', 'humanoid']);
  });

  it('drops pieces that case-insensitively duplicate another newly split piece', function() {
    expect(buildTagsAfterAdd([], 'Goblin, goblin, GOBLIN')).toEqual(['Goblin']);
  });

  it('returns the unchanged pending list when the input is blank', function() {
    expect(buildTagsAfterAdd(['goblin'], '   ')).toEqual(['goblin']);
  });
});

describe('StlModelNewModal', function() {
  const buildProps = (overrides = {}) => ({
    show: true,
    onClose: Noop.noop,
    onSuccess: Noop.noop,
    ...overrides,
  });

  it('renders through StlModelNewModalHelper.render with the show flag and the initial idle form state', function() {
    const renderSpy = spyOn(StlModelNewModalHelper, 'render').and.callThrough();

    renderToStaticMarkup(React.createElement(StlModelNewModal, buildProps({ show: true })));

    expect(renderSpy).toHaveBeenCalledWith(
      true,
      {
        name: '', tags: [], tagInput: '', status: 'idle', fieldErrors: {}, photoPreviewUrl: null,
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

    renderToStaticMarkup(React.createElement(StlModelNewModal, buildProps()));

    expect(capturedState.deferred).toBe(true);
  });

  it('renders the photo upload modal initially closed', function() {
    let capturedShow;
    spyOn(PhotoUploadModalHelper, 'render').and.callFake((show) => {
      capturedShow = show;
      return null;
    });

    renderToStaticMarkup(React.createElement(StlModelNewModal, buildProps()));

    expect(capturedShow).toBe(false);
  });

  it('opens the upload modal via onOpenUploadModal without throwing', function() {
    let capturedHandlers;
    spyOn(StlModelNewModalHelper, 'render').and.callFake((show, state, handlers) => {
      capturedHandlers = handlers;
      return null;
    });

    renderToStaticMarkup(React.createElement(StlModelNewModal, buildProps()));

    expect(() => capturedHandlers.onOpenUploadModal()).not.toThrow();
  });

  it('appends split tags via onAddTag without throwing', function() {
    let capturedHandlers;
    spyOn(StlModelNewModalHelper, 'render').and.callFake((show, state, handlers) => {
      capturedHandlers = handlers;
      return null;
    });

    renderToStaticMarkup(React.createElement(StlModelNewModal, buildProps()));

    expect(() => capturedHandlers.onAddTag()).not.toThrow();
  });

  it('wires onSubmit to controller.submitForm with the name/tags/photo payload and an onSuccess setter', function() {
    let capturedHandlers;
    spyOn(StlModelNewModalHelper, 'render').and.callFake((show, state, handlers) => {
      capturedHandlers = handlers;
      return null;
    });
    spyOn(StlModelNewController.prototype, 'submitForm').and.returnValue(Promise.resolve());

    renderToStaticMarkup(React.createElement(StlModelNewModal, buildProps()));
    const event = jasmine.createSpyObj('event', ['preventDefault']);
    capturedHandlers.onSubmit(event);

    expect(StlModelNewController.prototype.submitForm).toHaveBeenCalledWith(
      event,
      jasmine.objectContaining({ name: '', tags: [], photoFile: null }),
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
    spyOn(StlModelNewModalHelper, 'render').and.callFake((show, state, handlers) => {
      capturedHandlers = handlers;
      return null;
    });
    spyOn(StlModelNewController.prototype, 'retryPhotoUpload').and.returnValue(Promise.resolve());

    renderToStaticMarkup(React.createElement(StlModelNewModal, buildProps()));
    capturedHandlers.onRetryPhotoUpload();

    expect(StlModelNewController.prototype.retryPhotoUpload).toHaveBeenCalledWith(
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
    spyOn(StlModelNewModalHelper, 'render').and.callFake((show, state, handlers) => {
      capturedHandlers = handlers;
      return null;
    });

    renderToStaticMarkup(React.createElement(StlModelNewModal, buildProps({ onSuccess })));
    capturedHandlers.onSkipPhotoUpload();

    expect(onSuccess).toHaveBeenCalled();
  });

  it('calls onClose when the modal is dismissed', function() {
    let capturedHandlers;
    const onClose = jasmine.createSpy('onClose');
    spyOn(StlModelNewModalHelper, 'render').and.callFake((show, state, handlers) => {
      capturedHandlers = handlers;
      return null;
    });

    renderToStaticMarkup(React.createElement(StlModelNewModal, buildProps({ onClose })));
    capturedHandlers.onClose();

    expect(onClose).toHaveBeenCalled();
  });

  it('passes the show prop through to the helper', function() {
    let capturedShow;
    spyOn(StlModelNewModalHelper, 'render').and.callFake((show) => {
      capturedShow = show;
      return null;
    });

    renderToStaticMarkup(React.createElement(StlModelNewModal, buildProps({ show: false })));

    expect(capturedShow).toBe(false);
  });
});
