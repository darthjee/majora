import { renderToStaticMarkup } from 'react-dom/server';
import GameFactionsHelper
  from '../../../../../../../../assets/js/components/resources/faction/pages/helpers/GameFactionsHelper.jsx';
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

describe('GameFactionsHelper', function() {
  const buildState = (overrides = {}) => ({
    gameSlug: 'demo',
    basePath: '#/games/demo/factions',
    backHref: '#/games/demo',
    canCreateFaction: false,
    refreshToken: 0,
    ...overrides,
  });

  const buildHandlers = () => ({ onNewClick: jasmine.createSpy('onNewClick') });

  describe('.render', function() {
    it('renders a back button to the parent game page', function() {
      const html = renderToStaticMarkup(GameFactionsHelper.render(buildState(), buildHandlers()));
      expect(html).toContain('href="#/games/demo"');
    });

    it('renders the factions heading', function() {
      const html = renderToStaticMarkup(GameFactionsHelper.render(buildState(), buildHandlers()));
      expect(html).toContain('Factions');
    });

    it('does not render the create faction button when canCreateFaction is false', function() {
      const html = renderToStaticMarkup(GameFactionsHelper.render(buildState(), buildHandlers()));
      expect(html).not.toContain('New Faction');
    });

    it('renders the create faction button when canCreateFaction is true', function() {
      const html = renderToStaticMarkup(
        GameFactionsHelper.render(buildState({ canCreateFaction: true }), buildHandlers()),
      );
      expect(html).toContain('New Faction');
    });

    it('wires the create faction button click to onNewClick', function() {
      const handlers = buildHandlers();
      const element = GameFactionsHelper.render(buildState({ canCreateFaction: true }), handlers);
      const button = findElement(element, (child) => child.type === 'button');

      expect(button.props.onClick).toBe(handlers.onNewClick);
    });

    it('wires a ListPage of type factions with the expected props', function() {
      const element = GameFactionsHelper.render(buildState(), buildHandlers());
      const listPage = findElement(element, (child) => child.type === ListPage);

      expect(listPage).not.toBeNull();
      expect(listPage.props.type).toBe('factions');
      expect(listPage.props.gameSlug).toBe('demo');
      expect(listPage.props.basePath).toBe('#/games/demo/factions');
    });

    it('passes the refreshToken through to ListPage', function() {
      const element = GameFactionsHelper.render(buildState({ refreshToken: 3 }), buildHandlers());
      const listPage = findElement(element, (child) => child.type === ListPage);

      expect(listPage.props.refreshToken).toBe(3);
    });
  });
});
