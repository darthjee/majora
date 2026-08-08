import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import StlModel from '../../../../../../../assets/js/components/resources/stl_model/pages/StlModel.jsx';
import StlModelHelper from '../../../../../../../assets/js/components/resources/stl_model/pages/helpers/StlModelHelper.jsx';
import StlModelController from '../../../../../../../assets/js/components/resources/stl_model/pages/controllers/StlModelController.js';
import PhotoUploadModalHelper
  from '../../../../../../../assets/js/components/common/modals/helpers/PhotoUploadModalHelper.jsx';
import PhotoUploadModalController
  from '../../../../../../../assets/js/components/common/modals/controllers/PhotoUploadModalController.js';
import FacadeRefresh from '../../../../../../../assets/js/utils/access/useFacadeRefresh.js';
import RequestStore from '../../../../../../../assets/js/utils/requests/RequestStore.js';
import Noop from '../../../../../../../assets/js/utils/Noop.js';
import { stubBuildEffect, stubRenderLoading } from '../../../../../../support/controllerStubs.js';
import { buildStlModel } from '../../../../../../support/factories.js';

const loadedStlModel = buildStlModel({ id: 9, name: 'Goblin Miniature' });

/** Stub controller that synchronously loads a STL model during construction. */
class LoadedController {
  constructor(setStlModel, setLoading) {
    setStlModel(loadedStlModel);
    setLoading(false);
  }

  buildEffect() { return () => Noop.noop; }
}

describe('StlModel', function() {
  it('renders the loading state while fetching', function() {
    stubBuildEffect(StlModelController);
    stubRenderLoading(StlModelHelper);

    const html = renderToStaticMarkup(React.createElement(StlModel));

    expect(html).toContain('loading');
  });

  it('wires FacadeRefresh.useFacadeRefresh with the page controller', function() {
    stubBuildEffect(StlModelController);
    spyOn(FacadeRefresh, 'useFacadeRefresh');

    renderToStaticMarkup(React.createElement(StlModel));

    expect(FacadeRefresh.useFacadeRefresh).toHaveBeenCalledWith(jasmine.any(StlModelController));
  });

  it('renders the STL model name via StlModelHelper.render', function() {
    stubBuildEffect(StlModelController);

    const stlModel = buildStlModel({ id: 1, name: 'Goblin Miniature' });
    const html = renderToStaticMarkup(StlModelHelper.render(stlModel, false, { onOpenUploadModal: Noop.noop }));

    expect(html).toContain('Goblin Miniature');
  });

  describe('once loaded', function() {
    it('renders the STL model via StlModelHelper', function() {
      const html = renderToStaticMarkup(React.createElement(StlModel, { ControllerClass: LoadedController }));

      expect(html).toContain('Goblin Miniature');
    });

    it('renders the upload modal initially closed', function() {
      let capturedShow;
      spyOn(PhotoUploadModalHelper, 'render').and.callFake((show) => {
        capturedShow = show;
        return null;
      });

      renderToStaticMarkup(React.createElement(StlModel, { ControllerClass: LoadedController }));

      expect(capturedShow).toBe(false);
    });

    it('opens the upload modal via onOpenUploadModal without throwing', function() {
      let capturedHandlers;
      spyOn(StlModelHelper, 'render').and.callFake((stlModel, isStaffOrSuperUser, handlers) => {
        capturedHandlers = handlers;
        return null;
      });

      renderToStaticMarkup(React.createElement(StlModel, { ControllerClass: LoadedController }));

      expect(() => capturedHandlers.onOpenUploadModal()).not.toThrow();
    });

    it('purges the stlModel cache and refetches via buildEffect when the upload succeeds', function() {
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

      renderToStaticMarkup(React.createElement(StlModel, { ControllerClass: LoadedController }));

      const callsBefore = buildEffectSpy.calls.count();
      capturedHandlers.onSubmit();

      expect(RequestStore.purge).toHaveBeenCalledWith({ resource: 'stlModel' });
      expect(buildEffectSpy.calls.count()).toBeGreaterThan(callsBefore);
    });
  });
});
