import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import PhotoUploadModal from '../../../../../../assets/js/components/common/modals/PhotoUploadModal.jsx';
import PhotoUploadModalHelper from '../../../../../../assets/js/components/common/modals/helpers/PhotoUploadModalHelper.jsx';
import PhotoUploadModalController from '../../../../../../assets/js/components/common/modals/controllers/PhotoUploadModalController.js';

describe('PhotoUploadModal', function() {
  describe('#render', function() {
    it('passes the default state to the helper', function() {
      spyOn(PhotoUploadModalHelper, 'render').and.returnValue(
        React.createElement('div', null, 'modal')
      );

      const onClose = jasmine.createSpy('onClose');
      const onSuccess = jasmine.createSpy('onSuccess');

      renderToStaticMarkup(
        React.createElement(PhotoUploadModal, {
          show: true,
          uploadPath: '/games/my-game/photo_upload.json',
          onClose,
          onSuccess,
        })
      );

      expect(PhotoUploadModalHelper.render).toHaveBeenCalledWith(
        true,
        {
          file: null,
          error: false,
          uploading: false,
          deferred: false,
        },
        jasmine.objectContaining({
          onClose: jasmine.any(Function),
          onCancel: jasmine.any(Function),
          onSubmit: jasmine.any(Function),
          onFileChange: jasmine.any(Function),
          onDragOver: jasmine.any(Function),
          onDrop: jasmine.any(Function),
        })
      );
    });

    it('calls onClose when the modal close handler is triggered', function() {
      const onClose = jasmine.createSpy('onClose');
      const onSuccess = jasmine.createSpy('onSuccess');
      let capturedHandlers;

      spyOn(PhotoUploadModalHelper, 'render').and.callFake((show, state, handlers) => {
        capturedHandlers = handlers;
        return React.createElement('div', null, 'modal');
      });

      renderToStaticMarkup(
        React.createElement(PhotoUploadModal, {
          show: true,
          uploadPath: '/games/my-game/photo_upload.json',
          onClose,
          onSuccess,
        })
      );

      capturedHandlers.onClose();

      expect(onClose).toHaveBeenCalled();
    });

    it('calls onClose when the cancel handler is triggered', function() {
      const onClose = jasmine.createSpy('onClose');
      const onSuccess = jasmine.createSpy('onSuccess');
      let capturedHandlers;

      spyOn(PhotoUploadModalHelper, 'render').and.callFake((show, state, handlers) => {
        capturedHandlers = handlers;
        return React.createElement('div', null, 'modal');
      });

      renderToStaticMarkup(
        React.createElement(PhotoUploadModal, {
          show: false,
          uploadPath: '/games/my-game/photo_upload.json',
          onClose,
          onSuccess,
        })
      );

      capturedHandlers.onCancel();

      expect(onClose).toHaveBeenCalled();
    });

    it('calls event.preventDefault on drag over', function() {
      let capturedHandlers;

      spyOn(PhotoUploadModalHelper, 'render').and.callFake((show, state, handlers) => {
        capturedHandlers = handlers;
        return React.createElement('div', null, 'modal');
      });

      renderToStaticMarkup(
        React.createElement(PhotoUploadModal, {
          show: false,
          uploadPath: '/games/my-game/photo_upload.json',
          onClose: jasmine.createSpy('onClose'),
          onSuccess: jasmine.createSpy('onSuccess'),
        })
      );

      const fakeEvent = { preventDefault: jasmine.createSpy('preventDefault') };
      capturedHandlers.onDragOver(fakeEvent);

      expect(fakeEvent.preventDefault).toHaveBeenCalled();
    });

    describe('deferred mode', function() {
      it('passes deferred through to the helper state', function() {
        let capturedState;
        spyOn(PhotoUploadModalHelper, 'render').and.callFake((show, state) => {
          capturedState = state;
          return React.createElement('div', null, 'modal');
        });

        renderToStaticMarkup(
          React.createElement(PhotoUploadModal, {
            show: true,
            deferred: true,
            onFileConfirmed: jasmine.createSpy('onFileConfirmed'),
            onClose: jasmine.createSpy('onClose'),
          })
        );

        expect(capturedState.deferred).toBe(true);
      });

      it('calls onFileConfirmed and closes without calling the upload controller', function() {
        spyOn(PhotoUploadModalController.prototype, 'handleSubmit');
        const onFileConfirmed = jasmine.createSpy('onFileConfirmed');
        const onClose = jasmine.createSpy('onClose');
        let capturedHandlers;
        let capturedState;

        spyOn(PhotoUploadModalHelper, 'render').and.callFake((show, state, handlers) => {
          capturedState = state;
          capturedHandlers = handlers;
          return React.createElement('div', null, 'modal');
        });

        renderToStaticMarkup(
          React.createElement(PhotoUploadModal, {
            show: true,
            deferred: true,
            onFileConfirmed,
            onClose,
          })
        );

        capturedHandlers.onSubmit();

        expect(onFileConfirmed).toHaveBeenCalledWith(null);
        expect(onClose).toHaveBeenCalled();
        expect(PhotoUploadModalController.prototype.handleSubmit).not.toHaveBeenCalled();
        expect(capturedState.uploading).toBe(false);
      });
    });
  });
});
