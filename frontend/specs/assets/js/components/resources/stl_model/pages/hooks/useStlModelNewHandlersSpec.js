import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import useStlModelNewHandlers, { buildHandlers }
  from '../../../../../../../../assets/js/components/resources/stl_model/pages/hooks/useStlModelNewHandlers.js';

/**
 * Minimal component exercising `useStlModelNewHandlers`, capturing what the hook returns.
 *
 * @param {object} props - Component props.
 * @param {object} props.params - Params passed through to the hook.
 * @param {Function} props.onResult - Callback invoked with the hook's return value.
 * @returns {React.ReactElement} A trivial element.
 */
function TestHost({ params, onResult }) {
  onResult(useStlModelNewHandlers(params));
  return React.createElement('div', null, 'ok');
}

describe('useStlModelNewHandlers', function() {
  let result;

  beforeEach(function() {
    renderToStaticMarkup(React.createElement(TestHost, {
      params: {
        controller: {},
        formData: {},
        photoFile: null,
        setStatus: jasmine.createSpy('setStatus'),
        setFieldErrors: jasmine.createSpy('setFieldErrors'),
      },
      onResult: (value) => { result = value; },
    }));
  });

  it('exposes the handlers', function() {
    expect(Object.keys(result.handlers).sort()).toEqual([
      'onOpenUploadModal', 'onRetryPhotoUpload', 'onSkipPhotoUpload', 'onSubmit',
    ]);
  });

  it('starts with the upload modal hidden', function() {
    expect(result.modalProps.showUploadModal).toBe(false);
  });

  it('exposes a modal close callback', function() {
    expect(result.modalProps.onClose).toEqual(jasmine.any(Function));
  });
});

describe('buildHandlers', function() {
  let controller, setters, formData, photoFile, handlers;

  beforeEach(function() {
    controller = jasmine.createSpyObj('controller', ['submitForm', 'retryPhotoUpload']);
    setters = {
      setStatus: jasmine.createSpy('setStatus'),
      setFieldErrors: jasmine.createSpy('setFieldErrors'),
      setCreatedId: jasmine.createSpy('setCreatedId'),
      setShowUploadModal: jasmine.createSpy('setShowUploadModal'),
    };
    formData = { name: 'Dragon', sources: [], collections: [] };
    photoFile = { name: 'photo.png' };

    handlers = buildHandlers({
      controller, formData, createdId: 42, photoFile, setters,
    });
  });

  it('submits the form data through the controller', function() {
    const event = { preventDefault: jasmine.createSpy('preventDefault') };

    handlers.onSubmit(event);

    expect(controller.submitForm).toHaveBeenCalledWith(event, formData, {
      setStatus: setters.setStatus,
      setFieldErrors: setters.setFieldErrors,
      setCreatedId: setters.setCreatedId,
    });
  });

  it('opens the upload modal', function() {
    handlers.onOpenUploadModal();

    expect(setters.setShowUploadModal).toHaveBeenCalledWith(true);
  });

  it('retries the photo upload for the created model', function() {
    handlers.onRetryPhotoUpload();

    expect(controller.retryPhotoUpload).toHaveBeenCalledWith(42, photoFile, {
      setStatus: setters.setStatus,
      setCreatedId: setters.setCreatedId,
    });
  });

  describe('when skipping the photo upload', function() {
    let originalWindow;

    beforeEach(function() {
      originalWindow = global.window;
      global.window = { location: { hash: '' } };
    });

    afterEach(function() {
      global.window = originalWindow;
    });

    it('redirects to the created model page', function() {
      handlers.onSkipPhotoUpload();

      expect(global.window.location.hash).toBe('/miniatures/stl_models/42');
    });
  });

  describe('when skipping the photo upload without a window', function() {
    let originalWindow;

    beforeEach(function() {
      originalWindow = global.window;
      delete global.window;
    });

    afterEach(function() {
      global.window = originalWindow;
    });

    it('does not throw', function() {
      expect(() => handlers.onSkipPhotoUpload()).not.toThrow();
    });
  });
});
