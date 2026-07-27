import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import GameDocumentPhotos
  from '../../../../../../../assets/js/components/resources/document/pages/GameDocumentPhotos.jsx';
import GameDocumentPhotosHelper
  from '../../../../../../../assets/js/components/resources/document/pages/helpers/GameDocumentPhotosHelper.jsx';
import Noop from '../../../../../../../assets/js/utils/Noop.js';

const loadedPhotos = [{ id: 1, path: '/photos/1.jpg' }];
const loadedPagination = { page: 1, pages: 1, perPage: 10 };

/** Stub controller that synchronously loads photos during construction. */
class LoadedController {
  constructor(setPhotos, setPagination, setLoading) {
    setPhotos(loadedPhotos);
    setPagination(loadedPagination);
    setLoading(false);
  }

  buildEffect() { return () => Noop.noop; }
}

/** Stub controller that stays in the loading state. */
class LoadingController {
  buildEffect() { return () => Noop.noop; }
}

/** Stub controller that synchronously sets an error during construction. */
class ErroredController {
  constructor(setPhotos, setPagination, setLoading, setError) {
    setError('Unable to load photos.');
    setLoading(false);
  }

  buildEffect() { return () => Noop.noop; }
}

describe('GameDocumentPhotos', function() {
  let originalWindow;

  beforeEach(function() {
    originalWindow = globalThis.window;
    globalThis.window = { location: { hash: '#/games/demo/documents/9/photos' } };
  });

  afterEach(function() {
    globalThis.window = originalWindow;
  });

  it('renders the loading state while photos are loading', function() {
    const html = renderToStaticMarkup(
      React.createElement(GameDocumentPhotos, { ControllerClass: LoadingController }),
    );

    expect(html).toContain('Loading photos...');
  });

  it('renders the error state when photos fail to load', function() {
    const html = renderToStaticMarkup(
      React.createElement(GameDocumentPhotos, { ControllerClass: ErroredController }),
    );

    expect(html).toContain('Unable to load photos.');
  });

  it('delegates to GameDocumentPhotosHelper.render with the photos, pagination, and hrefs', function() {
    let capturedPhotos;
    let capturedPagination;
    let capturedBasePath;
    let capturedBackHref;
    spyOn(GameDocumentPhotosHelper, 'render').and.callFake((photos, pagination, basePath, backHref) => {
      capturedPhotos = photos;
      capturedPagination = pagination;
      capturedBasePath = basePath;
      capturedBackHref = backHref;
      return null;
    });

    renderToStaticMarkup(React.createElement(GameDocumentPhotos, { ControllerClass: LoadedController }));

    expect(capturedPhotos).toEqual(loadedPhotos);
    expect(capturedPagination).toEqual(loadedPagination);
    expect(capturedBasePath).toBe('#/games/demo/documents/9/photos');
    expect(capturedBackHref).toBe('#/games/demo/documents/9');
  });

  it('opens the photo view modal via the onSelectPhoto handler passed to GameDocumentPhotosHelper', function() {
    let capturedOnSelectPhoto;
    spyOn(GameDocumentPhotosHelper, 'render').and.callFake((photos, pagination, basePath, backHref, onSelectPhoto) => {
      capturedOnSelectPhoto = onSelectPhoto;
      return null;
    });

    renderToStaticMarkup(React.createElement(GameDocumentPhotos, { ControllerClass: LoadedController }));

    expect(() => capturedOnSelectPhoto(loadedPhotos[0])).not.toThrow();
  });
});
