import { renderToStaticMarkup } from 'react-dom/server';
import CharacterDocumentsHelper
  from '../../../../../../../../assets/js/components/resources/character/pages/helpers/CharacterDocumentsHelper.jsx';
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

describe('CharacterDocumentsHelper', function() {
  describe('.render', function() {
    it('renders a back button to the parent PC page', function() {
      const html = renderToStaticMarkup(CharacterDocumentsHelper.render('pcs', 'pc-documents', 'demo', '7'));
      expect(html).toContain('href="#/games/demo/pcs/7"');
    });

    it('renders a back button to the parent NPC page', function() {
      const html = renderToStaticMarkup(CharacterDocumentsHelper.render('npcs', 'npc-documents', 'demo', '9'));
      expect(html).toContain('href="#/games/demo/npcs/9"');
    });

    it('renders the documents heading', function() {
      const html = renderToStaticMarkup(CharacterDocumentsHelper.render('pcs', 'pc-documents', 'demo', '7'));
      expect(html).toContain('Documents');
    });

    it('wires a ListPage of type pc-documents with the expected props', function() {
      const element = CharacterDocumentsHelper.render('pcs', 'pc-documents', 'demo', '7');
      const listPage = findElement(element, (child) => child.type === ListPage);

      expect(listPage).not.toBeNull();
      expect(listPage.props.type).toBe('pc-documents');
      expect(listPage.props.gameSlug).toBe('demo');
      expect(listPage.props.basePath).toBe('#/games/demo/pcs/7/documents');
      expect(listPage.props.context).toEqual({ characterId: '7' });
    });

    it('wires a ListPage of type npc-documents with the expected props', function() {
      const element = CharacterDocumentsHelper.render('npcs', 'npc-documents', 'demo', '9');
      const listPage = findElement(element, (child) => child.type === ListPage);

      expect(listPage).not.toBeNull();
      expect(listPage.props.type).toBe('npc-documents');
      expect(listPage.props.gameSlug).toBe('demo');
      expect(listPage.props.basePath).toBe('#/games/demo/npcs/9/documents');
      expect(listPage.props.context).toEqual({ characterId: '9' });
    });

    it('does not render a "New"/"Add" action', function() {
      const html = renderToStaticMarkup(CharacterDocumentsHelper.render('pcs', 'pc-documents', 'demo', '7'));
      expect(html).not.toContain('New');
    });
  });
});
