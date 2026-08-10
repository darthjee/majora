import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import Source from '../../../../../../../assets/js/components/resources/source/pages/Source.jsx';
import SourceHelper from '../../../../../../../assets/js/components/resources/source/pages/helpers/SourceHelper.jsx';
import SourceController from '../../../../../../../assets/js/components/resources/source/pages/controllers/SourceController.js';
import PhotoUploadModalHelper
  from '../../../../../../../assets/js/components/common/modals/helpers/PhotoUploadModalHelper.jsx';
import PhotoUploadModalController
  from '../../../../../../../assets/js/components/common/modals/controllers/PhotoUploadModalController.js';
import FacadeRefresh from '../../../../../../../assets/js/utils/access/useFacadeRefresh.js';
import RequestStore from '../../../../../../../assets/js/utils/requests/RequestStore.js';
import Noop from '../../../../../../../assets/js/utils/Noop.js';
import { stubBuildEffect, stubRenderLoading } from '../../../../../../support/controllerStubs.js';
import { buildSource } from '../../../../../../support/factories.js';

const loadedSource = buildSource({ id: 9, name: 'MyMiniFactory' });

/** Stub controller that synchronously loads a source during construction. */
class LoadedController {
  constructor(setSource, setLoading) {
    setSource(loadedSource);
    setLoading(false);
  }

  buildEffect() { return () => Noop.noop; }
}

describe('Source', function() {
  it('renders the loading state while fetching', function() {
    stubBuildEffect(SourceController);
    stubRenderLoading(SourceHelper);

    const html = renderToStaticMarkup(React.createElement(Source));

    expect(html).toContain('loading');
  });

  it('wires FacadeRefresh.useFacadeRefresh with the page controller', function() {
    stubBuildEffect(SourceController);
    spyOn(FacadeRefresh, 'useFacadeRefresh');

    renderToStaticMarkup(React.createElement(Source));

    expect(FacadeRefresh.useFacadeRefresh).toHaveBeenCalledWith(jasmine.any(SourceController));
  });

  it('renders the source name via SourceHelper.render', function() {
    stubBuildEffect(SourceController);

    const source = buildSource({ id: 1, name: 'MyMiniFactory' });
    const html = renderToStaticMarkup(SourceHelper.render(source, false, { onOpenUploadModal: Noop.noop }));

    expect(html).toContain('MyMiniFactory');
  });

  describe('once loaded', function() {
    it('renders the source via SourceHelper', function() {
      const html = renderToStaticMarkup(React.createElement(Source, { ControllerClass: LoadedController }));

      expect(html).toContain('MyMiniFactory');
    });

    it('renders the upload modal initially closed', function() {
      let capturedShow;
      spyOn(PhotoUploadModalHelper, 'render').and.callFake((show) => {
        capturedShow = show;
        return null;
      });

      renderToStaticMarkup(React.createElement(Source, { ControllerClass: LoadedController }));

      expect(capturedShow).toBe(false);
    });

    it('opens the upload modal via onOpenUploadModal without throwing', function() {
      let capturedHandlers;
      spyOn(SourceHelper, 'render').and.callFake((source, isStaffOrSuperUser, handlers) => {
        capturedHandlers = handlers;
        return null;
      });

      renderToStaticMarkup(React.createElement(Source, { ControllerClass: LoadedController }));

      expect(() => capturedHandlers.onOpenUploadModal()).not.toThrow();
    });

    it('purges the source cache and refetches via buildEffect when the upload succeeds', function() {
      spyOn(RequestStore, 'purge');
      spyOn(PhotoUploadModalController.prototype, 'handleSubmit').and.callFake(function submit() {
        this.onSuccess();
        return Promise.resolve();
      });
      const buildEffectSpy = spyOn(LoadedController.prototype, 'buildEffect')
        .and.returnValue(() => Noop.noop);
      let capturedHandlers;
      spyOn(PhotoUploadModalHelper, 'render').and.callFake((show, state, handlers) => {
        capturedHandlers = handlers;
        return null;
      });

      renderToStaticMarkup(React.createElement(Source, { ControllerClass: LoadedController }));

      const callsBefore = buildEffectSpy.calls.count();
      capturedHandlers.onSubmit();

      expect(RequestStore.purge).toHaveBeenCalledWith({ resource: 'source' });
      expect(buildEffectSpy.calls.count()).toBeGreaterThan(callsBefore);
    });
  });
});
