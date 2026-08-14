import { renderToStaticMarkup } from 'react-dom/server';
import StlModelsHelper
  from '../../../../../../../../assets/js/components/resources/stl_model/pages/helpers/StlModelsHelper.jsx';
import ListPage from '../../../../../../../../assets/js/components/common/list_page/ListPage.jsx';

const findElement = (node, matcher) => {
  if (!node) {
    return null;
  }

  if (Array.isArray(node)) {
    for (const child of node) {
      const match = findElement(child, matcher);

      if (match) {
        return match;
      }
    }

    return null;
  }

  if (typeof node !== 'object') {
    return null;
  }

  if (matcher(node)) {
    return node;
  }

  return findElement(node.props?.children, matcher);
};

describe('StlModelsHelper', function() {
  const buildState = (overrides = {}) => ({
    isStaffOrSuperUser: false, refreshToken: 0, activeFilters: new URLSearchParams(), ...overrides,
  });

  const buildHandlers = () => ({
    onFilterQuery: jasmine.createSpy('onFilterQuery'),
    onFilterClear: jasmine.createSpy('onFilterClear'),
  });

  describe('.render', function() {
    it('renders a back button to the home page', function() {
      const html = renderToStaticMarkup(StlModelsHelper.render(buildState(), buildHandlers()));
      expect(html).toContain('href="#/"');
    });

    it('renders the shared ListPage grid for the stlModels list type', function() {
      const html = renderToStaticMarkup(StlModelsHelper.render(buildState(), buildHandlers()));
      expect(html).toContain('container');
    });

    it('renders the New STL model link when isStaffOrSuperUser is true', function() {
      const html = renderToStaticMarkup(
        StlModelsHelper.render(buildState({ isStaffOrSuperUser: true }), buildHandlers())
      );
      expect(html).toContain('New STL Model');
      expect(html).toContain('href="#/miniatures/stl_models/new"');
    });

    it('does not render the New STL model link when isStaffOrSuperUser is false', function() {
      const html = renderToStaticMarkup(StlModelsHelper.render(buildState(), buildHandlers()));
      expect(html).not.toContain('New STL Model');
    });

    it('wires a ListPage of type stlModels with the filters bar props', function() {
      const handlers = buildHandlers();
      const activeFilters = new URLSearchParams('name=gob');
      const element = StlModelsHelper.render(buildState({ refreshToken: 3, activeFilters }), handlers);
      const listPage = findElement(element, (child) => child.type === ListPage);

      expect(listPage).not.toBeNull();
      expect(listPage.props.type).toBe('stlModels');
      expect(listPage.props.basePath).toBe('#/miniatures/stl_models');
      expect(listPage.props.refreshToken).toBe(3);
      expect(listPage.props.activeFilters).toBe(activeFilters);
      expect(listPage.props.filtersProps.onQuery).toBe(handlers.onFilterQuery);
      expect(listPage.props.filtersProps.onClear).toBe(handlers.onFilterClear);
    });
  });
});
