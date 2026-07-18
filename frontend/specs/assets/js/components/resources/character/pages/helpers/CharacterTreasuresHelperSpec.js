import { renderToStaticMarkup } from 'react-dom/server';
import CharacterTreasuresHelper
  from '../../../../../../../../assets/js/components/resources/character/pages/helpers/CharacterTreasuresHelper.jsx';
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

describe('CharacterTreasuresHelper', function() {
  const baseState = {
    gameSlug: 'demo',
    listType: 'pc-treasures',
    basePath: '#/games/demo/pcs/1/treasures',
    backHref: '#/games/demo/pcs/1',
    canEdit: false,
    refreshToken: 0,
    activeFilters: {},
  };
  const baseHandlers = {
    onAddTreasure: Noop.noop,
    onFilterQuery: Noop.noop,
    onFilterClear: Noop.noop,
    onItemsChange: Noop.noop,
  };

  describe('.render', function() {
    it('renders the page heading', function() {
      const html = renderToStaticMarkup(CharacterTreasuresHelper.render(baseState, baseHandlers));
      expect(html).toContain('Treasures');
    });

    it('renders a back button to the parent character page', function() {
      const html = renderToStaticMarkup(CharacterTreasuresHelper.render(baseState, baseHandlers));
      expect(html).toContain('href="#/games/demo/pcs/1"');
    });

    it('does not render the "Exchange Treasure" button when canEdit is false', function() {
      const html = renderToStaticMarkup(CharacterTreasuresHelper.render(baseState, baseHandlers));
      expect(html).not.toContain('Exchange Treasure');
    });

    it('renders the "Exchange Treasure" button when canEdit is true', function() {
      const html = renderToStaticMarkup(
        CharacterTreasuresHelper.render({ ...baseState, canEdit: true }, baseHandlers),
      );
      expect(html).toContain('Exchange Treasure');
    });

    it('invokes onAddTreasure when the "Exchange Treasure" button is clicked', function() {
      const onAddTreasure = jasmine.createSpy('onAddTreasure');
      const element = CharacterTreasuresHelper.render(
        { ...baseState, canEdit: true }, { ...baseHandlers, onAddTreasure },
      );
      const button = findElement(element, (child) => typeof child.props?.onClick === 'function');

      button.props.onClick();

      expect(onAddTreasure).toHaveBeenCalled();
    });

    it('wires a ListPage of the given listType with the expected props', function() {
      const handlers = {
        onAddTreasure: Noop.noop,
        onFilterQuery: jasmine.createSpy('onFilterQuery'),
        onFilterClear: jasmine.createSpy('onFilterClear'),
        onItemsChange: jasmine.createSpy('onItemsChange'),
      };
      const element = CharacterTreasuresHelper.render({ ...baseState, listType: 'npc-treasures' }, handlers);
      const listPage = findElement(element, (child) => child.type === ListPage);

      expect(listPage).not.toBeNull();
      expect(listPage.props.type).toBe('npc-treasures');
      expect(listPage.props.gameSlug).toBe('demo');
      expect(listPage.props.basePath).toBe('#/games/demo/pcs/1/treasures');
      expect(listPage.props.filtersProps.onQuery).toBe(handlers.onFilterQuery);
      expect(listPage.props.filtersProps.onClear).toBe(handlers.onFilterClear);
      expect(listPage.props.filtersProps.showGameType).toBe(false);
      expect(listPage.props.onItemsChange).toBe(handlers.onItemsChange);
    });

    it('preserves active filters on the ListPage', function() {
      const element = CharacterTreasuresHelper.render(
        { ...baseState, activeFilters: { name: 'sword' } }, baseHandlers,
      );
      const listPage = findElement(element, (child) => child.type === ListPage);

      expect(listPage.props.activeFilters).toEqual({ name: 'sword' });
    });
  });
});
