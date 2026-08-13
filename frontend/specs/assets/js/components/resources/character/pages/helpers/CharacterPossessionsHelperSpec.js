import { renderToStaticMarkup } from 'react-dom/server';
import CharacterPossessionsHelper from '../../../../../../../../assets/js/components/resources/character/pages/helpers/CharacterPossessionsHelper.jsx';
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

describe('CharacterPossessionsHelper', function() {
  describe('.render', function() {
    it('renders a back button to the parent PC page', function() {
      const html = renderToStaticMarkup(CharacterPossessionsHelper.render('pcs', 'pc-possessions', 'demo', '7'));
      expect(html).toContain('href="#/games/demo/pcs/7"');
    });

    it('renders a back button to the parent NPC page', function() {
      const html = renderToStaticMarkup(CharacterPossessionsHelper.render('npcs', 'npc-possessions', 'demo', '9'));
      expect(html).toContain('href="#/games/demo/npcs/9"');
    });

    it('renders the possessions heading', function() {
      const html = renderToStaticMarkup(CharacterPossessionsHelper.render('pcs', 'pc-possessions', 'demo', '7'));
      expect(html).toContain('Possessions');
    });

    it('wires a ListPage of type pc-possessions with the expected props', function() {
      const element = CharacterPossessionsHelper.render('pcs', 'pc-possessions', 'demo', '7');
      const listPage = findElement(element, (child) => child.type === ListPage);

      expect(listPage).not.toBeNull();
      expect(listPage.props.type).toBe('pc-possessions');
      expect(listPage.props.gameSlug).toBe('demo');
      expect(listPage.props.basePath).toBe('#/games/demo/pcs/7/possessions');
      expect(listPage.props.context).toEqual({ characterId: '7' });
    });

    it('wires a ListPage of type npc-possessions with the expected props', function() {
      const element = CharacterPossessionsHelper.render('npcs', 'npc-possessions', 'demo', '9');
      const listPage = findElement(element, (child) => child.type === ListPage);

      expect(listPage).not.toBeNull();
      expect(listPage.props.type).toBe('npc-possessions');
      expect(listPage.props.gameSlug).toBe('demo');
      expect(listPage.props.basePath).toBe('#/games/demo/npcs/9/possessions');
      expect(listPage.props.context).toEqual({ characterId: '9' });
    });

    it('does not render a "Create Possession" button by default', function() {
      const html = renderToStaticMarkup(CharacterPossessionsHelper.render('pcs', 'pc-possessions', 'demo', '7'));
      expect(html).not.toContain('Create Possession');
    });

    it('does not render a "Create Possession" button when canCreatePossession is false', function() {
      const html = renderToStaticMarkup(
        CharacterPossessionsHelper.render('pcs', 'pc-possessions', 'demo', '7', false),
      );
      expect(html).not.toContain('Create Possession');
    });

    it('renders a "Create Possession" button linking to the PC possession new form', function() {
      const html = renderToStaticMarkup(
        CharacterPossessionsHelper.render('pcs', 'pc-possessions', 'demo', '7', true),
      );
      expect(html).toContain('Create Possession');
      expect(html).toContain('href="#/games/demo/pcs/7/possessions/new"');
    });

    it('renders a "Create Possession" button linking to the NPC possession new form', function() {
      const html = renderToStaticMarkup(
        CharacterPossessionsHelper.render('npcs', 'npc-possessions', 'demo', '9', true),
      );
      expect(html).toContain('Create Possession');
      expect(html).toContain('href="#/games/demo/npcs/9/possessions/new"');
    });

    it('does not render an "Exchange Possessions" button when canCreatePossession is false', function() {
      const html = renderToStaticMarkup(
        CharacterPossessionsHelper.render(
          'pcs', 'pc-possessions', 'demo', '7', false, 0, jasmine.createSpy('onExchangePossessions'),
        ),
      );
      expect(html).not.toContain('Exchange Possessions');
    });

    it('does not render an "Exchange Possessions" button when no onExchangePossessions handler is given', function() {
      const html = renderToStaticMarkup(
        CharacterPossessionsHelper.render('pcs', 'pc-possessions', 'demo', '7', true),
      );
      expect(html).not.toContain('Exchange Possessions');
    });

    it('renders an "Exchange Possessions" button when canCreatePossession is true and a handler is given', function() {
      const html = renderToStaticMarkup(
        CharacterPossessionsHelper.render(
          'pcs', 'pc-possessions', 'demo', '7', true, 0, jasmine.createSpy('onExchangePossessions'),
        ),
      );
      expect(html).toContain('Exchange Possessions');
    });

    it('wires the "Exchange Possessions" button click to the given handler', function() {
      const onExchangePossessions = jasmine.createSpy('onExchangePossessions');
      const element = CharacterPossessionsHelper.render(
        'pcs', 'pc-possessions', 'demo', '7', true, 0, onExchangePossessions,
      );
      const button = findElement(element, (child) => typeof child.props?.onClick === 'function');

      button.props.onClick();

      expect(onExchangePossessions).toHaveBeenCalled();
    });

    it('passes refreshToken through to ListPage', function() {
      const element = CharacterPossessionsHelper.render('pcs', 'pc-possessions', 'demo', '7', false, 3);
      const listPage = findElement(element, (child) => child.type === ListPage);

      expect(listPage.props.refreshToken).toBe(3);
    });
  });
});
