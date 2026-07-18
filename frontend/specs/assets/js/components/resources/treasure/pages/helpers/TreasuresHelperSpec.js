import { renderToStaticMarkup } from 'react-dom/server';
import TreasuresHelper from '../../../../../../../../assets/js/components/resources/treasure/pages/helpers/TreasuresHelper.jsx';
import ListPage from '../../../../../../../../assets/js/components/common/ListPage.jsx';
import PhotoUploadModal from '../../../../../../../../assets/js/components/common/PhotoUploadModal.jsx';

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

describe('TreasuresHelper', function() {
  const buildState = (overrides = {}) => ({
    basePath: '#/treasures',
    refreshToken: 0,
    activeFilters: {},
    showUploadModal: false,
    selectedTreasure: null,
    ...overrides,
  });

  const buildHandlers = () => ({
    onUploadClick: jasmine.createSpy('onUploadClick'),
    onUploadClose: jasmine.createSpy('onUploadClose'),
    onUploadSuccess: jasmine.createSpy('onUploadSuccess'),
    onFilterQuery: jasmine.createSpy('onFilterQuery'),
    onFilterClear: jasmine.createSpy('onFilterClear'),
  });

  describe('.render', function() {
    it('renders a back button to the home page', function() {
      const html = renderToStaticMarkup(TreasuresHelper.render(buildState(), buildHandlers()));
      expect(html).toContain('href="#/"');
    });

    it('renders a New Treasure link', function() {
      const html = renderToStaticMarkup(TreasuresHelper.render(buildState(), buildHandlers()));
      expect(html).toContain('href="#/treasures/new"');
    });

    it('wires a ListPage of type treasures-global with the expected props', function() {
      const handlers = buildHandlers();
      const element = TreasuresHelper.render(buildState(), handlers);
      const listPage = findElement(element, (child) => child.type === ListPage);

      expect(listPage).not.toBeNull();
      expect(listPage.props.type).toBe('treasures-global');
      expect(listPage.props.basePath).toBe('#/treasures');
      expect(listPage.props.context.onUploadClick).toBe(handlers.onUploadClick);
      expect(listPage.props.filtersProps.onQuery).toBe(handlers.onFilterQuery);
      expect(listPage.props.filtersProps.onClear).toBe(handlers.onFilterClear);
    });

    it('wires the photo upload modal to the selected treasure', function() {
      const handlers = buildHandlers();
      const element = TreasuresHelper.render(
        buildState({ showUploadModal: true, selectedTreasure: { id: 7 } }), handlers,
      );
      const uploadModal = findElement(element, (child) => child.type === PhotoUploadModal);

      expect(uploadModal.props.show).toBe(true);
      expect(uploadModal.props.uploadPath).toBe('/treasures/7/photo_upload.json');
      expect(uploadModal.props.onClose).toBe(handlers.onUploadClose);
      expect(uploadModal.props.onSuccess).toBe(handlers.onUploadSuccess);
    });
  });

  describe('.renderLoading', function() {
    it('renders a loading message', function() {
      const html = renderToStaticMarkup(TreasuresHelper.renderLoading());
      expect(html).toContain('Loading');
    });
  });
});
