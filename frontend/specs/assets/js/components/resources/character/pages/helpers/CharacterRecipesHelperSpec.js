import { renderToStaticMarkup } from 'react-dom/server';
import CharacterRecipesHelper
  from '../../../../../../../../assets/js/components/resources/character/pages/helpers/CharacterRecipesHelper.jsx';
import ListPage from '../../../../../../../../assets/js/components/common/list_page/ListPage.jsx';
import Translator from '../../../../../../../../assets/js/i18n/Translator.js';

const findElement = (node, matcher) => {
  if (!node || typeof node !== 'object') {
    return null;
  }

  if (Array.isArray(node)) {
    return node.map((child) => findElement(child, matcher)).find(Boolean) ?? null;
  }

  if (matcher(node)) {
    return node;
  }

  return findElement(node.props?.children, matcher);
};

const buildState = (overrides = {}) => ({
  characterKind: 'pcs',
  listType: 'pc-recipes',
  gameSlug: 'demo',
  characterId: '7',
  refreshToken: 0,
  itemsCount: null,
  canExchange: false,
  ...overrides,
});

describe('CharacterRecipesHelper', function() {
  describe('.render', function() {
    it('renders a back button to the parent PC page', function() {
      const html = renderToStaticMarkup(CharacterRecipesHelper.render(buildState()));

      expect(html).toContain('href="#/games/demo/pcs/7"');
    });

    it('renders a back button to the parent NPC page', function() {
      const html = renderToStaticMarkup(CharacterRecipesHelper.render(buildState({
        characterKind: 'npcs', listType: 'npc-recipes', characterId: '9',
      })));

      expect(html).toContain('href="#/games/demo/npcs/9"');
    });

    it('renders the recipes heading', function() {
      const html = renderToStaticMarkup(CharacterRecipesHelper.render(buildState()));

      expect(html).toContain(Translator.t('character_recipes_page.title'));
    });

    it('wires a ListPage with the expected props', function() {
      const onItemsChange = jasmine.createSpy('onItemsChange');
      const element = CharacterRecipesHelper.render(buildState({ refreshToken: 3 }), { onItemsChange });
      const listPage = findElement(element, (child) => child.type === ListPage);

      expect(listPage.props.type).toBe('pc-recipes');
      expect(listPage.props.gameSlug).toBe('demo');
      expect(listPage.props.basePath).toBe('#/games/demo/pcs/7/recipes');
      expect(listPage.props.context).toEqual({ characterId: '7' });
      expect(listPage.props.refreshToken).toBe(3);
      expect(listPage.props.handlers.onItemsChange).toBe(onItemsChange);
    });

    it('defaults refreshToken to 0', function() {
      const element = CharacterRecipesHelper.render(buildState({ refreshToken: undefined }));
      const listPage = findElement(element, (child) => child.type === ListPage);

      expect(listPage.props.refreshToken).toBe(0);
    });

    it('does not render the Exchange button when canExchange is false', function() {
      const html = renderToStaticMarkup(CharacterRecipesHelper.render(buildState()));

      expect(html).not.toContain(Translator.t('character_recipes_page.exchange_button'));
    });

    it('renders the Exchange button wired to onExchange when canExchange is true', function() {
      const onExchange = jasmine.createSpy('onExchange');
      const element = CharacterRecipesHelper.render(buildState({ canExchange: true }), { onExchange });
      const button = findElement(element, (child) => child.props?.onClick === onExchange);

      expect(renderToStaticMarkup(element)).toContain(Translator.t('character_recipes_page.exchange_button'));
      expect(button).not.toBeNull();
    });

    it('renders the empty message when the loaded page has no recipes', function() {
      const html = renderToStaticMarkup(CharacterRecipesHelper.render(buildState({ itemsCount: 0 })));

      expect(html).toContain(Translator.t('character_recipes_page.empty'));
    });

    it('does not render the empty message while loading or when recipes exist', function() {
      [null, 2].forEach((itemsCount) => {
        const html = renderToStaticMarkup(CharacterRecipesHelper.render(buildState({ itemsCount })));

        expect(html).not.toContain(Translator.t('character_recipes_page.empty'));
      });
    });
  });
});
