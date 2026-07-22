import { renderToStaticMarkup } from 'react-dom/server';
import CharacterHelper from '../../../../../../../../../assets/js/components/resources/character/pages/helpers/CharacterHelper.jsx';
import PreviewSection from '../../../../../../../../../assets/js/components/common/cards/PreviewSection.jsx';
import DocumentPreviewCard from '../../../../../../../../../assets/js/components/common/cards/DocumentPreviewCard.jsx';
import { character, findElement } from './support.js';

/**
 * Locates the documents `<PreviewSection>` element (distinguished from the sibling
 * items preview section by its empty-state text) and invokes its `renderItem` for
 * the given owned document, then renders the resulting `DocumentPreviewCard` (a
 * plain, hook-free function component) to reach its tooltip content.
 *
 * @param {object} characterWithDocuments - Character data including `documents`.
 * @param {string} backHref - Hash path to the character's index page.
 * @param {object} document - Owned document object passed to `renderItem`.
 * @returns {React.ReactNode} The rendered `DocumentPreviewCard`'s tooltip content.
 */
function buildTooltipContent(characterWithDocuments, backHref, document) {
  const tree = CharacterHelper.render(characterWithDocuments, backHref);
  const section = findElement(
    tree, (node) => node.type === PreviewSection && node.props.emptyText === 'No documents yet.',
  );
  const cardElement = section.props.renderItem(document);
  const cardTree = DocumentPreviewCard(cardElement.props);

  return cardTree.props.children.props.content;
}

describe('CharacterHelper', function() {
  describe('documents preview section', function() {
    it('renders the heading, defaulting to an empty list', function() {
      const withDocuments = {
        ...character,
        documents: [{ id: 1, game_document_id: 9, name: 'Ancient Tome' }],
      };
      const html = renderToStaticMarkup(CharacterHelper.render(withDocuments, '#/games/demo/pcs'));
      expect(html).toContain('Documents');
      expect(renderToStaticMarkup(CharacterHelper.render(character, '#/games/demo/pcs'))).toContain('Documents');
    });

    it('feeds only the document name to the tooltip content', function() {
      const withDocuments = { ...character, documents: [] };
      const documentEntry = { id: 1, game_document_id: 9, name: 'Ancient Tome' };
      const content = buildTooltipContent(withDocuments, '#/games/demo/pcs', documentEntry);

      expect(content).toBe('Ancient Tome');
    });

    it('renders a see all link to the pcs documents page', function() {
      const c = {
        ...character, game_slug: 'demo', id: 7, is_pc: true, documents: [],
      };
      const html = renderToStaticMarkup(CharacterHelper.render(c, '#/games/demo/pcs'));
      expect(html).toContain('href="#/games/demo/pcs/7/documents"');
    });

    it('renders a see all link to the npcs documents page', function() {
      const c = {
        ...character, game_slug: 'demo', id: 7, is_pc: false, documents: [],
      };
      const html = renderToStaticMarkup(CharacterHelper.render(c, '#/games/demo/npcs'));
      expect(html).toContain('href="#/games/demo/npcs/7/documents"');
    });

    it('renders the empty-state message when there are no documents', function() {
      const html = renderToStaticMarkup(CharacterHelper.render(character, '#/games/demo/pcs'));
      expect(html).toContain('No documents yet.');
    });
  });
});
