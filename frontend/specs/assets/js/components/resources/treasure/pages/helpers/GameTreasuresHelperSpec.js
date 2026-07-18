import { renderToStaticMarkup } from 'react-dom/server';
import GameTreasuresHelper from '../../../../../../../../assets/js/components/resources/treasure/pages/helpers/GameTreasuresHelper.jsx';
import ListPage from '../../../../../../../../assets/js/components/common/ListPage.jsx';
import PhotoUploadModal from '../../../../../../../../assets/js/components/common/PhotoUploadModal.jsx';
import AddGameTreasureModal from '../../../../../../../../assets/js/components/resources/treasure/pages/elements/AddGameTreasureModal.jsx';

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

describe('GameTreasuresHelper', function() {
  const buildState = (overrides = {}) => ({
    gameSlug: 'demo',
    basePath: '#/games/demo/treasures',
    backHref: '#/games/demo',
    newHref: '#/games/demo/treasures/new',
    canEdit: false,
    refreshToken: 0,
    activeFilters: {},
    showUploadModal: false,
    selectedTreasure: null,
    showAddModal: false,
    ...overrides,
  });

  const buildHandlers = () => ({
    onCanEditChange: jasmine.createSpy('onCanEditChange'),
    onUploadClick: jasmine.createSpy('onUploadClick'),
    onUploadClose: jasmine.createSpy('onUploadClose'),
    onUploadSuccess: jasmine.createSpy('onUploadSuccess'),
    onAddClick: jasmine.createSpy('onAddClick'),
    onAddClose: jasmine.createSpy('onAddClose'),
    onAddSuccess: jasmine.createSpy('onAddSuccess'),
    onFilterQuery: jasmine.createSpy('onFilterQuery'),
    onFilterClear: jasmine.createSpy('onFilterClear'),
  });

  describe('.render', function() {
    it('renders a back button to the parent game page', function() {
      const html = renderToStaticMarkup(GameTreasuresHelper.render(buildState(), buildHandlers()));
      expect(html).toContain('href="#/games/demo"');
    });

    it('renders the treasures heading', function() {
      const html = renderToStaticMarkup(GameTreasuresHelper.render(buildState(), buildHandlers()));
      expect(html).toContain('Treasures');
    });

    it('does not render the new/add treasure buttons when canEdit is false', function() {
      const html = renderToStaticMarkup(GameTreasuresHelper.render(buildState(), buildHandlers()));
      expect(html).not.toContain('New Treasure');
      expect(html).not.toContain('Add Treasure');
    });

    it('renders the new treasure button when canEdit is true', function() {
      const html = renderToStaticMarkup(
        GameTreasuresHelper.render(buildState({ canEdit: true }), buildHandlers())
      );
      expect(html).toContain('New Treasure');
      expect(html).toContain('href="#/games/demo/treasures/new"');
    });

    it('renders the add treasure button when canEdit is true', function() {
      const html = renderToStaticMarkup(
        GameTreasuresHelper.render(buildState({ canEdit: true }), buildHandlers())
      );
      expect(html).toContain('Add Treasure');
    });

    it('wires a ListPage of type treasures with the expected props', function() {
      const handlers = buildHandlers();
      const element = GameTreasuresHelper.render(buildState(), handlers);
      const listPage = findElement(element, (child) => child.type === ListPage);

      expect(listPage).not.toBeNull();
      expect(listPage.props.type).toBe('treasures');
      expect(listPage.props.gameSlug).toBe('demo');
      expect(listPage.props.basePath).toBe('#/games/demo/treasures');
      expect(listPage.props.context.onUploadClick).toBe(handlers.onUploadClick);
      expect(listPage.props.filtersProps.onQuery).toBe(handlers.onFilterQuery);
      expect(listPage.props.filtersProps.onClear).toBe(handlers.onFilterClear);
      expect(listPage.props.filtersProps.showGameType).toBe(false);
      expect(listPage.props.onCanEditChange).toBe(handlers.onCanEditChange);
    });

    it('wires the photo upload modal to the selected treasure', function() {
      const handlers = buildHandlers();
      const element = GameTreasuresHelper.render(
        buildState({ showUploadModal: true, selectedTreasure: { id: 7 } }), handlers,
      );
      const uploadModal = findElement(element, (child) => child.type === PhotoUploadModal);

      expect(uploadModal.props.show).toBe(true);
      expect(uploadModal.props.uploadPath).toBe('/treasures/7/photo_upload.json');
      expect(uploadModal.props.onClose).toBe(handlers.onUploadClose);
      expect(uploadModal.props.onSuccess).toBe(handlers.onUploadSuccess);
    });

    it('wires the add treasure modal to the game slug', function() {
      const handlers = buildHandlers();
      const element = GameTreasuresHelper.render(buildState({ showAddModal: true }), handlers);
      const addModal = findElement(element, (child) => child.type === AddGameTreasureModal);

      expect(addModal.props.show).toBe(true);
      expect(addModal.props.gameSlug).toBe('demo');
      expect(addModal.props.onClose).toBe(handlers.onAddClose);
      expect(addModal.props.onSuccess).toBe(handlers.onAddSuccess);
    });
  });
});
