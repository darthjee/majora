import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import GameDocumentFiles
  from '../../../../../../../assets/js/components/resources/document/pages/GameDocumentFiles.jsx';
import GameDocumentFilesHelper
  from '../../../../../../../assets/js/components/resources/document/pages/helpers/GameDocumentFilesHelper.jsx';
import Noop from '../../../../../../../assets/js/utils/Noop.js';

const loadedFiles = [{ id: 1, name: 'Notes', path: '/files/1/download', photo_path: null }];
const loadedPagination = { page: 1, pages: 1, perPage: 10 };

/** Stub controller that synchronously loads files during construction. */
class LoadedController {
  constructor(setFiles, setPagination, setLoading) {
    setFiles(loadedFiles);
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
  constructor(setFiles, setPagination, setLoading, setError) {
    setError('Unable to load files.');
    setLoading(false);
  }

  buildEffect() { return () => Noop.noop; }
}

describe('GameDocumentFiles', function() {
  let originalWindow;

  beforeEach(function() {
    originalWindow = globalThis.window;
    globalThis.window = { location: { hash: '#/games/demo/documents/9/files' } };
  });

  afterEach(function() {
    globalThis.window = originalWindow;
  });

  it('renders the loading state while files are loading', function() {
    const html = renderToStaticMarkup(
      React.createElement(GameDocumentFiles, { ControllerClass: LoadingController }),
    );

    expect(html).toContain('Loading files...');
  });

  it('renders the error state when files fail to load', function() {
    const html = renderToStaticMarkup(
      React.createElement(GameDocumentFiles, { ControllerClass: ErroredController }),
    );

    expect(html).toContain('Unable to load files.');
  });

  it('delegates to GameDocumentFilesHelper.render with the files, pagination, and hrefs', function() {
    let capturedFiles;
    let capturedPagination;
    let capturedBasePath;
    let capturedBackHref;
    spyOn(GameDocumentFilesHelper, 'render').and.callFake((files, pagination, basePath, backHref) => {
      capturedFiles = files;
      capturedPagination = pagination;
      capturedBasePath = basePath;
      capturedBackHref = backHref;
      return null;
    });

    renderToStaticMarkup(React.createElement(GameDocumentFiles, { ControllerClass: LoadedController }));

    expect(capturedFiles).toEqual(loadedFiles);
    expect(capturedPagination).toEqual(loadedPagination);
    expect(capturedBasePath).toBe('#/games/demo/documents/9/files');
    expect(capturedBackHref).toBe('#/games/demo/documents/9');
  });
});
