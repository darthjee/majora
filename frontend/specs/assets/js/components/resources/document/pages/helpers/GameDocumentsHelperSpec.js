import { renderToStaticMarkup } from 'react-dom/server';
import GameDocumentsHelper
  from '../../../../../../../../assets/js/components/resources/document/pages/helpers/GameDocumentsHelper.jsx';
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

describe('GameDocumentsHelper', function() {
  const buildState = (overrides = {}) => ({
    gameSlug: 'demo',
    basePath: '#/games/demo/documents',
    backHref: '#/games/demo',
    newHref: '#/games/demo/documents/new',
    canCreateDocument: false,
    ...overrides,
  });

  describe('.render', function() {
    it('renders a back button to the parent game page', function() {
      const html = renderToStaticMarkup(GameDocumentsHelper.render(buildState()));
      expect(html).toContain('href="#/games/demo"');
    });

    it('renders the documents heading', function() {
      const html = renderToStaticMarkup(GameDocumentsHelper.render(buildState()));
      expect(html).toContain('Documents');
    });

    it('does not render the create document button when canCreateDocument is false', function() {
      const html = renderToStaticMarkup(GameDocumentsHelper.render(buildState()));
      expect(html).not.toContain('Create Document');
    });

    it('renders the create document button when canCreateDocument is true', function() {
      const html = renderToStaticMarkup(
        GameDocumentsHelper.render(buildState({ canCreateDocument: true })),
      );
      expect(html).toContain('Create Document');
      expect(html).toContain('href="#/games/demo/documents/new"');
    });

    it('wires a ListPage of type documents with the expected props', function() {
      const element = GameDocumentsHelper.render(buildState());
      const listPage = findElement(element, (child) => child.type === ListPage);

      expect(listPage).not.toBeNull();
      expect(listPage.props.type).toBe('documents');
      expect(listPage.props.gameSlug).toBe('demo');
      expect(listPage.props.basePath).toBe('#/games/demo/documents');
    });
  });
});
