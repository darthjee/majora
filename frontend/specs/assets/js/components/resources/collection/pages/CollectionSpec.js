import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import Collection from '../../../../../../../assets/js/components/resources/collection/pages/Collection.jsx';
import CollectionHelper from '../../../../../../../assets/js/components/resources/collection/pages/helpers/CollectionHelper.jsx';
import CollectionController
  from '../../../../../../../assets/js/components/resources/collection/pages/controllers/CollectionController.js';
import PhotoUploadModalHelper
  from '../../../../../../../assets/js/components/common/modals/helpers/PhotoUploadModalHelper.jsx';
import PhotoUploadModalController
  from '../../../../../../../assets/js/components/common/modals/controllers/PhotoUploadModalController.js';
import FacadeRefresh from '../../../../../../../assets/js/utils/access/useFacadeRefresh.js';
import RequestStore from '../../../../../../../assets/js/utils/requests/RequestStore.js';
import Noop from '../../../../../../../assets/js/utils/Noop.js';
import { stubBuildEffect, stubRenderLoading } from '../../../../../../support/controllerStubs.js';
import { buildCollection } from '../../../../../../support/factories.js';

const loadedCollection = buildCollection({ id: 9, name: 'Goblin Pack' });

/** Stub controller that synchronously loads a collection during construction. */
class LoadedController {
  constructor(setCollection, setLoading) {
    setCollection(loadedCollection);
    setLoading(false);
  }

  buildEffect() { return () => Noop.noop; }
}

describe('Collection', function() {
  it('renders the loading state while fetching', function() {
    stubBuildEffect(CollectionController);
    stubRenderLoading(CollectionHelper);

    const html = renderToStaticMarkup(React.createElement(Collection));

    expect(html).toContain('loading');
  });

  it('wires FacadeRefresh.useFacadeRefresh with the page controller', function() {
    stubBuildEffect(CollectionController);
    spyOn(FacadeRefresh, 'useFacadeRefresh');

    renderToStaticMarkup(React.createElement(Collection));

    expect(FacadeRefresh.useFacadeRefresh).toHaveBeenCalledWith(jasmine.any(CollectionController));
  });

  it('renders the collection name via CollectionHelper.render', function() {
    stubBuildEffect(CollectionController);

    const collection = buildCollection({ id: 1, name: 'Goblin Pack' });
    const html = renderToStaticMarkup(CollectionHelper.render(collection, false, { onOpenUploadModal: Noop.noop }));

    expect(html).toContain('Goblin Pack');
  });

  describe('once loaded', function() {
    it('renders the collection via CollectionHelper', function() {
      const html = renderToStaticMarkup(React.createElement(Collection, { ControllerClass: LoadedController }));

      expect(html).toContain('Goblin Pack');
    });

    it('renders the upload modal initially closed', function() {
      let capturedShow;
      spyOn(PhotoUploadModalHelper, 'render').and.callFake((show) => {
        capturedShow = show;
        return null;
      });

      renderToStaticMarkup(React.createElement(Collection, { ControllerClass: LoadedController }));

      expect(capturedShow).toBe(false);
    });

    it('opens the upload modal via onOpenUploadModal without throwing', function() {
      let capturedHandlers;
      spyOn(CollectionHelper, 'render').and.callFake((collection, isStaffOrSuperUser, handlers) => {
        capturedHandlers = handlers;
        return null;
      });

      renderToStaticMarkup(React.createElement(Collection, { ControllerClass: LoadedController }));

      expect(() => capturedHandlers.onOpenUploadModal()).not.toThrow();
    });

    it('purges the collection cache and refetches via buildEffect when the upload succeeds', function() {
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

      renderToStaticMarkup(React.createElement(Collection, { ControllerClass: LoadedController }));

      const callsBefore = buildEffectSpy.calls.count();
      capturedHandlers.onSubmit();

      expect(RequestStore.purge).toHaveBeenCalledWith({ resource: 'collection' });
      expect(buildEffectSpy.calls.count()).toBeGreaterThan(callsBefore);
    });
  });
});
