import { renderToStaticMarkup } from 'react-dom/server';
import GamePossessionsHelper
  from '../../../../../../../../assets/js/components/resources/possession/pages/helpers/GamePossessionsHelper.jsx';
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

describe('GamePossessionsHelper', function() {
  const buildState = (overrides = {}) => ({
    gameSlug: 'demo',
    basePath: '#/games/demo/possessions',
    backHref: '#/games/demo',
    newHref: '#/games/demo/possessions/new',
    canCreatePossession: false,
    ...overrides,
  });

  describe('.render', function() {
    it('renders a back button to the parent game page', function() {
      const html = renderToStaticMarkup(GamePossessionsHelper.render(buildState()));
      expect(html).toContain('href="#/games/demo"');
    });

    it('renders the possessions heading', function() {
      const html = renderToStaticMarkup(GamePossessionsHelper.render(buildState()));
      expect(html).toContain('Possessions');
    });

    it('does not render the create possession button when canCreatePossession is false', function() {
      const html = renderToStaticMarkup(GamePossessionsHelper.render(buildState()));
      expect(html).not.toContain('Create Possession');
    });

    it('renders the create possession button when canCreatePossession is true', function() {
      const html = renderToStaticMarkup(
        GamePossessionsHelper.render(buildState({ canCreatePossession: true })),
      );
      expect(html).toContain('Create Possession');
      expect(html).toContain('href="#/games/demo/possessions/new"');
    });

    it('wires a ListPage of type possessions with the expected props', function() {
      const element = GamePossessionsHelper.render(buildState());
      const listPage = findElement(element, (child) => child.type === ListPage);

      expect(listPage).not.toBeNull();
      expect(listPage.props.type).toBe('possessions');
      expect(listPage.props.gameSlug).toBe('demo');
      expect(listPage.props.basePath).toBe('#/games/demo/possessions');
    });
  });
});
