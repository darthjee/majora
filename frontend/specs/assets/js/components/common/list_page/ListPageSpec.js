import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ListPage from '../../../../../../assets/js/components/common/list_page/ListPage.jsx';
import ListPageController from '../../../../../../assets/js/components/common/list_page/controllers/ListPageController.js';
import ListPageHelper from '../../../../../../assets/js/components/common/list_page/helpers/ListPageHelper.jsx';
import listTypeConfig from '../../../../../../assets/js/components/common/list_types/listTypeConfig.js';
import FacadeRefresh from '../../../../../../assets/js/utils/access/useFacadeRefresh.js';
import { stubBuildEffect, stubRenderLoading, captureConstructorFields }
  from '../../../../../support/controllerStubs.js';

describe('ListPage', function() {
  const baseProps = {
    type: 'treasures', gameSlug: 'demo', basePath: '#/games/demo/treasures', loadingMessage: 'Loading...',
  };

  it('renders the loading state while fetching', function() {
    stubBuildEffect(ListPageController);
    stubRenderLoading(ListPageHelper);

    const html = renderToStaticMarkup(React.createElement(ListPage, baseProps));

    expect(html).toContain('loading');
  });

  it('wires FacadeRefresh.useFacadeRefresh with the page controller', function() {
    stubBuildEffect(ListPageController);
    spyOn(FacadeRefresh, 'useFacadeRefresh');

    renderToStaticMarkup(React.createElement(ListPage, baseProps));

    expect(FacadeRefresh.useFacadeRefresh).toHaveBeenCalledWith(jasmine.any(ListPageController));
  });

  it('constructs the controller with the type and gameSlug props', function() {
    const capture = captureConstructorFields(ListPageController, ['type', 'gameSlug']);
    stubBuildEffect(ListPageController);

    renderToStaticMarkup(React.createElement(ListPage, baseProps));

    expect(capture.spies.type).toBe('treasures');
    expect(capture.spies.gameSlug).toBe('demo');

    capture.restore();
  });

  it('propagates the resolved edit permission to onCanEditChange and the setters received real state', async function() {
    const fields = ['setItems', 'setPagination', 'setLoading', 'setError', 'setCanEdit'];
    const capture = captureConstructorFields(ListPageController, fields);
    const onCanEditChange = jasmine.createSpy('onCanEditChange');
    const fetchListSpy = spyOn(listTypeConfig.treasures, 'fetchList').and.returnValue(Promise.resolve({
      data: [{ id: 1, name: 'Sword' }],
      pagination: { page: 2, pages: 3, perPage: 4 },
      canEdit: true,
    }));

    renderToStaticMarkup(React.createElement(ListPage, { ...baseProps, onCanEditChange }));

    const cleanup = capture.getInstance().buildEffect()();
    await new Promise((resolve) => setTimeout(resolve, 0));
    cleanup();

    expect(fetchListSpy).toHaveBeenCalledWith('demo', jasmine.any(Object), jasmine.any(Object));
    expect(capture.spies.setItems).toHaveBeenCalledWith([{ id: 1, name: 'Sword' }]);
    expect(capture.spies.setPagination).toHaveBeenCalledWith({ page: 2, pages: 3, perPage: 4 });
    expect(capture.spies.setCanEdit).toHaveBeenCalledWith(true);
    expect(onCanEditChange).toHaveBeenCalledWith(true);

    capture.restore();
  });

  it('defaults onCanEditChange to a no-op', function() {
    stubBuildEffect(ListPageController);

    expect(() => renderToStaticMarkup(React.createElement(ListPage, baseProps))).not.toThrow();
  });

  it('propagates the freshly fetched items to onItemsChange', async function() {
    const fields = ['setItems', 'setPagination', 'setLoading', 'setError', 'setCanEdit'];
    const capture = captureConstructorFields(ListPageController, fields);
    const onItemsChange = jasmine.createSpy('onItemsChange');

    spyOn(listTypeConfig.treasures, 'fetchList').and.returnValue(Promise.resolve({
      data: [{ id: 1, name: 'Sword' }],
      pagination: { page: 1, pages: 1, perPage: 10 },
      canEdit: false,
    }));

    renderToStaticMarkup(React.createElement(ListPage, { ...baseProps, onItemsChange }));

    const cleanup = capture.getInstance().buildEffect()();
    await new Promise((resolve) => setTimeout(resolve, 0));
    cleanup();

    expect(onItemsChange).toHaveBeenCalledWith([{ id: 1, name: 'Sword' }]);

    capture.restore();
  });

  it('defaults onItemsChange to a no-op', function() {
    stubBuildEffect(ListPageController);

    expect(() => renderToStaticMarkup(React.createElement(ListPage, baseProps))).not.toThrow();
  });
});
