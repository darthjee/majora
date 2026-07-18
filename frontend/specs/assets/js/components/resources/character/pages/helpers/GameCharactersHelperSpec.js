import { renderToStaticMarkup } from 'react-dom/server';
import GameCharactersHelper from '../../../../../../../../assets/js/components/resources/character/pages/helpers/GameCharactersHelper.jsx';
import ListPage from '../../../../../../../../assets/js/components/common/list_page/ListPage.jsx';
import Noop from '../../../../../../../../assets/js/utils/Noop.js';

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

describe('GameCharactersHelper', function() {
  const baseState = {
    gameSlug: 'demo',
    basePath: '#/games/demo/npcs',
    backHref: '#/games/demo',
    newHref: '#/games/demo/npcs/new',
    canEdit: false,
    isPlayer: false,
    refreshToken: 0,
    activeFilters: {},
  };
  const baseHandlers = {
    onCanEditChange: Noop.noop,
    onUploadClick: Noop.noop,
    onSlainClick: Noop.noop,
    onPublicSlainClick: Noop.noop,
    onPlayerSlainClick: Noop.noop,
    onFilterQuery: Noop.noop,
    onFilterClear: Noop.noop,
  };

  describe('.render', function() {
    it('renders the page title', function() {
      const html = renderToStaticMarkup(GameCharactersHelper.render(baseState, baseHandlers));
      expect(html).toContain('Non-Player Characters');
    });

    it('renders a back button to the parent game page', function() {
      const html = renderToStaticMarkup(GameCharactersHelper.render(baseState, baseHandlers));
      expect(html).toContain('href="#/games/demo"');
    });

    it('does not render the new NPC button when canEdit is false', function() {
      const html = renderToStaticMarkup(GameCharactersHelper.render(baseState, baseHandlers));
      expect(html).not.toContain('New NPC');
    });

    it('renders the new NPC button when canEdit is true', function() {
      const html = renderToStaticMarkup(
        GameCharactersHelper.render({ ...baseState, canEdit: true }, baseHandlers),
      );
      expect(html).toContain('New NPC');
      expect(html).toContain('href="#/games/demo/npcs/new"');
    });

    it('wires a ListPage of type npcs with the expected props', function() {
      const handlers = {
        ...baseHandlers,
        onUploadClick: jasmine.createSpy('onUploadClick'),
        onSlainClick: jasmine.createSpy('onSlainClick'),
        onPublicSlainClick: jasmine.createSpy('onPublicSlainClick'),
        onPlayerSlainClick: jasmine.createSpy('onPlayerSlainClick'),
        onFilterQuery: jasmine.createSpy('onFilterQuery'),
        onFilterClear: jasmine.createSpy('onFilterClear'),
        onCanEditChange: jasmine.createSpy('onCanEditChange'),
      };
      const element = GameCharactersHelper.render({ ...baseState, isPlayer: true }, handlers);
      const listPage = findElement(element, (child) => child.type === ListPage);

      expect(listPage).not.toBeNull();
      expect(listPage.props.type).toBe('npcs');
      expect(listPage.props.gameSlug).toBe('demo');
      expect(listPage.props.basePath).toBe('#/games/demo/npcs');
      expect(listPage.props.context.isPlayer).toBe(true);
      expect(listPage.props.context.onUploadClick).toBe(handlers.onUploadClick);
      expect(listPage.props.context.onSlainClick).toBe(handlers.onSlainClick);
      expect(listPage.props.context.onPublicSlainClick).toBe(handlers.onPublicSlainClick);
      expect(listPage.props.context.onPlayerSlainClick).toBe(handlers.onPlayerSlainClick);
      expect(listPage.props.filtersProps.onQuery).toBe(handlers.onFilterQuery);
      expect(listPage.props.filtersProps.onClear).toBe(handlers.onFilterClear);
      expect(listPage.props.filtersProps.canEdit).toBe(false);
      expect(listPage.props.onCanEditChange).toBe(handlers.onCanEditChange);
    });
  });
});
