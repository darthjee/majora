import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import StlModelNew, { buildTagsAfterAdd }
  from '../../../../../../../assets/js/components/resources/stl_model/pages/StlModelNew.jsx';
import StlModelNewController
  from '../../../../../../../assets/js/components/resources/stl_model/pages/controllers/StlModelNewController.js';
import StlModelNewHelper
  from '../../../../../../../assets/js/components/resources/stl_model/pages/helpers/StlModelNewHelper.jsx';
import PhotoUploadModalHelper
  from '../../../../../../../assets/js/components/common/modals/helpers/PhotoUploadModalHelper.jsx';
import { stubBuildEffect } from '../../../../../../support/controllerStubs.js';

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

describe('StlModelNew', function() {
  beforeEach(function() {
    stubBuildEffect(StlModelNewController);
  });

  it('renders through StlModelNewHelper.render with the initial idle form state', function() {
    const renderSpy = spyOn(StlModelNewHelper, 'render').and.callThrough();

    renderToStaticMarkup(React.createElement(StlModelNew));

    expect(renderSpy).toHaveBeenCalledWith(
      jasmine.objectContaining({
        name: '',
        tags: [],
        tagInput: '',
        owned: true,
        type: 'terrain',
        race: '',
        role: '',
        sources: [],
        collections: [],
        status: 'idle',
        fieldErrors: {},
        photoPreviewUrl: null,
      }),
      jasmine.any(Object),
    );
  });

  it('renders the photo upload modal in deferred mode', function() {
    let capturedState;
    spyOn(PhotoUploadModalHelper, 'render').and.callFake((show, state) => {
      capturedState = state;
      return null;
    });

    renderToStaticMarkup(React.createElement(StlModelNew));

    expect(capturedState.deferred).toBe(true);
  });

  it('renders the photo upload modal initially closed', function() {
    let capturedShow;
    spyOn(PhotoUploadModalHelper, 'render').and.callFake((show) => {
      capturedShow = show;
      return null;
    });

    renderToStaticMarkup(React.createElement(StlModelNew));

    expect(capturedShow).toBe(false);
  });

  it('opens the upload modal via onOpenUploadModal without throwing', function() {
    let capturedHandlers;
    spyOn(StlModelNewHelper, 'render').and.callFake((state, handlers) => {
      capturedHandlers = handlers;
      return null;
    });

    renderToStaticMarkup(React.createElement(StlModelNew));

    expect(() => capturedHandlers.onOpenUploadModal()).not.toThrow();
  });

  it('appends split tags via onAddTag without throwing', function() {
    let capturedHandlers;
    spyOn(StlModelNewHelper, 'render').and.callFake((state, handlers) => {
      capturedHandlers = handlers;
      return null;
    });

    renderToStaticMarkup(React.createElement(StlModelNew));

    expect(() => capturedHandlers.onAddTag()).not.toThrow();
  });

  it('removes a tag via onRemoveTag without throwing', function() {
    let capturedHandlers;
    spyOn(StlModelNewHelper, 'render').and.callFake((state, handlers) => {
      capturedHandlers = handlers;
      return null;
    });

    renderToStaticMarkup(React.createElement(StlModelNew));

    expect(() => capturedHandlers.onRemoveTag('goblin')).not.toThrow();
  });

  it('picks sources/collections via onSourcesChange/onCollectionsChange without throwing', function() {
    let capturedHandlers;
    spyOn(StlModelNewHelper, 'render').and.callFake((state, handlers) => {
      capturedHandlers = handlers;
      return null;
    });

    renderToStaticMarkup(React.createElement(StlModelNew));

    expect(() => {
      capturedHandlers.onSourcesChange([{ id: 1, name: 'Wyrmwood' }]);
      capturedHandlers.onCollectionsChange([{ id: 2, name: 'Dungeon Pack' }]);
    }).not.toThrow();
  });

  it('updates owned/type/race/role via their change handlers without throwing', function() {
    let capturedHandlers;
    spyOn(StlModelNewHelper, 'render').and.callFake((state, handlers) => {
      capturedHandlers = handlers;
      return null;
    });

    renderToStaticMarkup(React.createElement(StlModelNew));

    expect(() => {
      capturedHandlers.onOwnedChange({ target: { checked: false } });
      capturedHandlers.onTypeChange({ target: { value: 'prop' } });
      capturedHandlers.onRaceChange({ target: { value: 'elf' } });
      capturedHandlers.onRoleChange({ target: { value: 'wizard' } });
    }).not.toThrow();
  });

  it('wires onSubmit to controller.submitForm with the full field payload', function() {
    let capturedHandlers;
    spyOn(StlModelNewHelper, 'render').and.callFake((state, handlers) => {
      capturedHandlers = handlers;
      return null;
    });
    spyOn(StlModelNewController.prototype, 'submitForm').and.returnValue(Promise.resolve());

    renderToStaticMarkup(React.createElement(StlModelNew));
    const event = jasmine.createSpyObj('event', ['preventDefault']);
    capturedHandlers.onSubmit(event);

    expect(StlModelNewController.prototype.submitForm).toHaveBeenCalledWith(
      event,
      jasmine.objectContaining({
        name: '',
        tags: [],
        owned: true,
        type: 'terrain',
        race: '',
        role: '',
        sources: [],
        collections: [],
        photoFile: null,
      }),
      jasmine.objectContaining({
        setStatus: jasmine.any(Function),
        setFieldErrors: jasmine.any(Function),
        setCreatedId: jasmine.any(Function),
      }),
    );
  });

  it('wires onRetryPhotoUpload to controller.retryPhotoUpload with the created id and photo file', function() {
    let capturedHandlers;
    spyOn(StlModelNewHelper, 'render').and.callFake((state, handlers) => {
      capturedHandlers = handlers;
      return null;
    });
    spyOn(StlModelNewController.prototype, 'retryPhotoUpload').and.returnValue(Promise.resolve());

    renderToStaticMarkup(React.createElement(StlModelNew));
    capturedHandlers.onRetryPhotoUpload();

    expect(StlModelNewController.prototype.retryPhotoUpload).toHaveBeenCalledWith(
      null,
      null,
      jasmine.objectContaining({
        setStatus: jasmine.any(Function),
        setCreatedId: jasmine.any(Function),
      }),
    );
  });

  it('redirects to the (not yet known) created STL model show page when the skip-photo-upload action is used',
    function() {
      let capturedHandlers;
      spyOn(StlModelNewHelper, 'render').and.callFake((state, handlers) => {
        capturedHandlers = handlers;
        return null;
      });
      const fakeWindow = { location: { hash: '' } };
      globalThis.window = fakeWindow;

      try {
        renderToStaticMarkup(React.createElement(StlModelNew));
        capturedHandlers.onSkipPhotoUpload();

        expect(fakeWindow.location.hash).toBe('/miniatures/stl_models/null');
      } finally {
        delete globalThis.window;
      }
    });
});
