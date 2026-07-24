import { renderToStaticMarkup } from 'react-dom/server';
import CharacterItemsHelper from '../../../../../../../../assets/js/components/resources/character/pages/helpers/CharacterItemsHelper.jsx';
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

describe('CharacterItemsHelper', function() {
  describe('.render', function() {
    it('renders a back button to the parent PC page', function() {
      const html = renderToStaticMarkup(CharacterItemsHelper.render('pcs', 'pc-items', 'demo', '7'));
      expect(html).toContain('href="#/games/demo/pcs/7"');
    });

    it('renders a back button to the parent NPC page', function() {
      const html = renderToStaticMarkup(CharacterItemsHelper.render('npcs', 'npc-items', 'demo', '9'));
      expect(html).toContain('href="#/games/demo/npcs/9"');
    });

    it('renders the items heading', function() {
      const html = renderToStaticMarkup(CharacterItemsHelper.render('pcs', 'pc-items', 'demo', '7'));
      expect(html).toContain('Items');
    });

    it('wires a ListPage of type pc-items with the expected props', function() {
      const element = CharacterItemsHelper.render('pcs', 'pc-items', 'demo', '7');
      const listPage = findElement(element, (child) => child.type === ListPage);

      expect(listPage).not.toBeNull();
      expect(listPage.props.type).toBe('pc-items');
      expect(listPage.props.gameSlug).toBe('demo');
      expect(listPage.props.basePath).toBe('#/games/demo/pcs/7/items');
      expect(listPage.props.context).toEqual({ characterId: '7' });
    });

    it('wires a ListPage of type npc-items with the expected props', function() {
      const element = CharacterItemsHelper.render('npcs', 'npc-items', 'demo', '9');
      const listPage = findElement(element, (child) => child.type === ListPage);

      expect(listPage).not.toBeNull();
      expect(listPage.props.type).toBe('npc-items');
      expect(listPage.props.gameSlug).toBe('demo');
      expect(listPage.props.basePath).toBe('#/games/demo/npcs/9/items');
      expect(listPage.props.context).toEqual({ characterId: '9' });
    });

    it('does not render a "Create Item" button by default', function() {
      const html = renderToStaticMarkup(CharacterItemsHelper.render('pcs', 'pc-items', 'demo', '7'));
      expect(html).not.toContain('Create Item');
    });

    it('does not render a "Create Item" button when canCreateItem is false', function() {
      const html = renderToStaticMarkup(CharacterItemsHelper.render('pcs', 'pc-items', 'demo', '7', false));
      expect(html).not.toContain('Create Item');
    });

    it('renders a "Create Item" button linking to the PC item new form when canCreateItem is true', function() {
      const html = renderToStaticMarkup(CharacterItemsHelper.render('pcs', 'pc-items', 'demo', '7', true));
      expect(html).toContain('Create Item');
      expect(html).toContain('href="#/games/demo/pcs/7/items/new"');
    });

    it('renders a "Create Item" button linking to the NPC item new form when canCreateItem is true', function() {
      const html = renderToStaticMarkup(CharacterItemsHelper.render('npcs', 'npc-items', 'demo', '9', true));
      expect(html).toContain('Create Item');
      expect(html).toContain('href="#/games/demo/npcs/9/items/new"');
    });

    it('does not render an "Exchange Items" button when canCreateItem is false', function() {
      const html = renderToStaticMarkup(
        CharacterItemsHelper.render('pcs', 'pc-items', 'demo', '7', false, 0, jasmine.createSpy('onExchangeItems'))
      );
      expect(html).not.toContain('Exchange Items');
    });

    it('does not render an "Exchange Items" button when no onExchangeItems handler is given', function() {
      const html = renderToStaticMarkup(CharacterItemsHelper.render('pcs', 'pc-items', 'demo', '7', true));
      expect(html).not.toContain('Exchange Items');
    });

    it('renders an "Exchange Items" button when canCreateItem is true and a handler is given', function() {
      const html = renderToStaticMarkup(
        CharacterItemsHelper.render('pcs', 'pc-items', 'demo', '7', true, 0, jasmine.createSpy('onExchangeItems'))
      );
      expect(html).toContain('Exchange Items');
    });

    it('wires the "Exchange Items" button click to the given handler', function() {
      const onExchangeItems = jasmine.createSpy('onExchangeItems');
      const element = CharacterItemsHelper.render('pcs', 'pc-items', 'demo', '7', true, 0, onExchangeItems);
      const button = findElement(element, (child) => typeof child.props?.onClick === 'function');

      button.props.onClick();

      expect(onExchangeItems).toHaveBeenCalled();
    });

    it('passes refreshToken through to ListPage', function() {
      const element = CharacterItemsHelper.render('pcs', 'pc-items', 'demo', '7', false, 3);
      const listPage = findElement(element, (child) => child.type === ListPage);

      expect(listPage.props.refreshToken).toBe(3);
    });
  });
});
