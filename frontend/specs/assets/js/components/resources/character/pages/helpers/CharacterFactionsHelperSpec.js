import { renderToStaticMarkup } from 'react-dom/server';
import CharacterFactionsHelper
  from '../../../../../../../../assets/js/components/resources/character/pages/helpers/CharacterFactionsHelper.jsx';
import ListPage from '../../../../../../../../assets/js/components/common/list_page/ListPage.jsx';
import Translator from '../../../../../../../../assets/js/i18n/Translator.js';

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

describe('CharacterFactionsHelper', function() {
  describe('.render', function() {
    it('renders a back button to the parent PC page', function() {
      const html = renderToStaticMarkup(CharacterFactionsHelper.render('pcs', 'pc-factions', 'demo', '7'));
      expect(html).toContain('href="#/games/demo/pcs/7"');
    });

    it('renders a back button to the parent NPC page', function() {
      const html = renderToStaticMarkup(CharacterFactionsHelper.render('npcs', 'npc-factions', 'demo', '9'));
      expect(html).toContain('href="#/games/demo/npcs/9"');
    });

    it('renders the factions heading', function() {
      const html = renderToStaticMarkup(CharacterFactionsHelper.render('pcs', 'pc-factions', 'demo', '7'));
      expect(html).toContain(Translator.t('character_factions_page.title'));
    });

    it('wires a ListPage of type pc-factions with the expected props', function() {
      const element = CharacterFactionsHelper.render('pcs', 'pc-factions', 'demo', '7');
      const listPage = findElement(element, (child) => child.type === ListPage);

      expect(listPage).not.toBeNull();
      expect(listPage.props.type).toBe('pc-factions');
      expect(listPage.props.gameSlug).toBe('demo');
      expect(listPage.props.basePath).toBe('#/games/demo/pcs/7/factions');
      expect(listPage.props.context).toEqual({ characterId: '7' });
    });

    it('wires a ListPage of type npc-factions with the expected props', function() {
      const element = CharacterFactionsHelper.render('npcs', 'npc-factions', 'demo', '9');
      const listPage = findElement(element, (child) => child.type === ListPage);

      expect(listPage).not.toBeNull();
      expect(listPage.props.type).toBe('npc-factions');
      expect(listPage.props.gameSlug).toBe('demo');
      expect(listPage.props.basePath).toBe('#/games/demo/npcs/9/factions');
      expect(listPage.props.context).toEqual({ characterId: '9' });
    });

    it('does not render a "New"/"Add" action', function() {
      const html = renderToStaticMarkup(CharacterFactionsHelper.render('pcs', 'pc-factions', 'demo', '7'));
      expect(html).not.toContain('New');
    });

    it('does not render an "Enlist" button when no onExchangeFactions handler is given', function() {
      const html = renderToStaticMarkup(CharacterFactionsHelper.render('pcs', 'pc-factions', 'demo', '7'));
      expect(html).not.toContain(Translator.t('character_factions_page.enlist_button'));
    });

    it('renders its own "Enlist" button label (not the modal\'s own "Faction Exchange" title) when a '
      + 'handler is given', function() {
      const html = renderToStaticMarkup(
        CharacterFactionsHelper.render(
          'pcs', 'pc-factions', 'demo', '7', 0, jasmine.createSpy('onExchangeFactions'),
        ),
      );
      expect(html).toContain(Translator.t('character_factions_page.enlist_button'));
      expect(html).not.toContain(Translator.t('faction_exchange_modal.title'));
    });

    it('wires the "Enlist" button click to the given handler', function() {
      const onExchangeFactions = jasmine.createSpy('onExchangeFactions');
      const element = CharacterFactionsHelper.render('pcs', 'pc-factions', 'demo', '7', 0, onExchangeFactions);
      const button = findElement(element, (child) => typeof child.props?.onClick === 'function');

      button.props.onClick();

      expect(onExchangeFactions).toHaveBeenCalled();
    });

    it('passes refreshToken through to ListPage', function() {
      const element = CharacterFactionsHelper.render('pcs', 'pc-factions', 'demo', '7', 3);
      const listPage = findElement(element, (child) => child.type === ListPage);

      expect(listPage.props.refreshToken).toBe(3);
    });
  });
});
