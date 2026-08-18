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
          translationPrefix: 'photo_upload_modal',
          accept: undefined,
          showNameField: false,
          name: '',
          showPhotoField: false,
        },
        jasmine.objectContaining({
          onClose: jasmine.any(Function),
          onCancel: jasmine.any(Function),
          onSubmit: jasmine.any(Function),
          onFileChange: jasmine.any(Function),
          onNameChange: jasmine.any(Function),
          onPhotoFileChange: jasmine.any(Function),
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

    describe('translationPrefix and accept (issue #726)', function() {
      it('forwards a custom translationPrefix and accept to the helper state', function() {
        let capturedState;
        spyOn(PhotoUploadModalHelper, 'render').and.callFake((show, state) => {
          capturedState = state;
          return React.createElement('div', null, 'modal');
        });

        renderToStaticMarkup(
          React.createElement(PhotoUploadModal, {
            show: true,
            uploadPath: '/games/my-game/documents/9/file_upload.json',
            fileUploadOptions: { translationPrefix: 'file_upload_modal', accept: '.pdf' },
            onClose: jasmine.createSpy('onClose'),
            onSuccess: jasmine.createSpy('onSuccess'),
          })
        );

        expect(capturedState.translationPrefix).toBe('file_upload_modal');
        expect(capturedState.accept).toBe('.pdf');
      });
    });

    describe('showNameField (issue #874)', function() {
      it('defaults showNameField to false and name to an empty string', function() {
        let capturedState;
        spyOn(PhotoUploadModalHelper, 'render').and.callFake((show, state) => {
          capturedState = state;
          return React.createElement('div', null, 'modal');
        });

        renderToStaticMarkup(
          React.createElement(PhotoUploadModal, {
            show: true,
            uploadPath: '/games/my-game/photo_upload.json',
            onClose: jasmine.createSpy('onClose'),
            onSuccess: jasmine.createSpy('onSuccess'),
          })
        );

        expect(capturedState.showNameField).toBe(false);
        expect(capturedState.name).toBe('');
      });

      it('forwards showNameField={true} to the helper state', function() {
        let capturedState;
        spyOn(PhotoUploadModalHelper, 'render').and.callFake((show, state) => {
          capturedState = state;
          return React.createElement('div', null, 'modal');
        });

        renderToStaticMarkup(
          React.createElement(PhotoUploadModal, {
            show: true,
            uploadPath: '/games/my-game/documents/9/file_upload.json',
            fileUploadOptions: { translationPrefix: 'file_upload_modal', showNameField: true },
            onClose: jasmine.createSpy('onClose'),
            onSuccess: jasmine.createSpy('onSuccess'),
          })
        );

        expect(capturedState.showNameField).toBe(true);
      });

      it('forwards the current name state to handleSubmit', function() {
        spyOn(PhotoUploadModalController.prototype, 'handleSubmit').and.returnValue(Promise.resolve());
        let capturedHandlers;

        spyOn(PhotoUploadModalHelper, 'render').and.callFake((show, state, handlers) => {
          capturedHandlers = handlers;
          return React.createElement('div', null, 'modal');
        });

        renderToStaticMarkup(
          React.createElement(PhotoUploadModal, {
            show: true,
            uploadPath: '/games/my-game/documents/9/file_upload.json',
            fileUploadOptions: { showNameField: true },
            onClose: jasmine.createSpy('onClose'),
            onSuccess: jasmine.createSpy('onSuccess'),
          })
        );

        capturedHandlers.onSubmit();

        expect(PhotoUploadModalController.prototype.handleSubmit).toHaveBeenCalledWith(
          '/games/my-game/documents/9/file_upload.json',
          null,
          null,
          ''
        );
      });
    });

  });
});
