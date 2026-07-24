import { renderToStaticMarkup } from 'react-dom/server';
import GameItemsHelper from '../../../../../../../../assets/js/components/resources/item/pages/helpers/GameItemsHelper.jsx';
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

describe('GameItemsHelper', function() {
  const buildState = (overrides = {}) => ({
    gameSlug: 'demo',
    basePath: '#/games/demo/items',
    backHref: '#/games/demo',
    newHref: '#/games/demo/items/new',
    canCreateItem: false,
    ...overrides,
  });

  describe('.render', function() {
    it('renders a back button to the parent game page', function() {
      const html = renderToStaticMarkup(GameItemsHelper.render(buildState()));
      expect(html).toContain('href="#/games/demo"');
    });

    it('renders the items heading', function() {
      const html = renderToStaticMarkup(GameItemsHelper.render(buildState()));
      expect(html).toContain('Items');
    });

    it('does not render the create item button when canCreateItem is false', function() {
      const html = renderToStaticMarkup(GameItemsHelper.render(buildState()));
      expect(html).not.toContain('Create Item');
    });

    it('renders the create item button when canCreateItem is true', function() {
      const html = renderToStaticMarkup(
        GameItemsHelper.render(buildState({ canCreateItem: true })),
      );
      expect(html).toContain('Create Item');
      expect(html).toContain('href="#/games/demo/items/new"');
    });

    it('wires a ListPage of type items with the expected props', function() {
      const element = GameItemsHelper.render(buildState());
      const listPage = findElement(element, (child) => child.type === ListPage);

      expect(listPage).not.toBeNull();
      expect(listPage.props.type).toBe('items');
      expect(listPage.props.gameSlug).toBe('demo');
      expect(listPage.props.basePath).toBe('#/games/demo/items');
    });
  });
});
