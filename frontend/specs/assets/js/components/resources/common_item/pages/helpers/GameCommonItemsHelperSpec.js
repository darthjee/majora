import { renderToStaticMarkup } from 'react-dom/server';
import GameCommonItemsHelper
  from '../../../../../../../../assets/js/components/resources/common_item/pages/helpers/GameCommonItemsHelper.jsx';
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

describe('GameCommonItemsHelper', function() {
  const buildState = (overrides = {}) => ({
    gameSlug: 'demo',
    basePath: '#/games/demo/common_items',
    backHref: '#/games/demo',
    newHref: '#/games/demo/common_items/new',
    canCreateCommonItem: false,
    ...overrides,
  });

  describe('.render', function() {
    it('renders a back button to the parent game page', function() {
      const html = renderToStaticMarkup(GameCommonItemsHelper.render(buildState()));
      expect(html).toContain('href="#/games/demo"');
    });

    it('renders the common items heading', function() {
      const html = renderToStaticMarkup(GameCommonItemsHelper.render(buildState()));
      expect(html).toContain('Common Items');
    });

    it('does not render the create common item button when canCreateCommonItem is false', function() {
      const html = renderToStaticMarkup(GameCommonItemsHelper.render(buildState()));
      expect(html).not.toContain('Create Common Item');
    });

    it('renders the create common item button when canCreateCommonItem is true', function() {
      const html = renderToStaticMarkup(
        GameCommonItemsHelper.render(buildState({ canCreateCommonItem: true })),
      );
      expect(html).toContain('Create Common Item');
      expect(html).toContain('href="#/games/demo/common_items/new"');
    });

    it('wires a ListPage of type commonItems with the expected props', function() {
      const element = GameCommonItemsHelper.render(buildState());
      const listPage = findElement(element, (child) => child.type === ListPage);

      expect(listPage).not.toBeNull();
      expect(listPage.props.type).toBe('commonItems');
      expect(listPage.props.gameSlug).toBe('demo');
      expect(listPage.props.basePath).toBe('#/games/demo/common_items');
    });
  });
});
