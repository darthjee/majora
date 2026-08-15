import { renderToStaticMarkup } from 'react-dom/server';
import DocumentPagesBoxHelper
  from '../../../../../../../../../../assets/js/components/resources/document/pages/elements/show/helpers/DocumentPagesBoxHelper.jsx';

describe('DocumentPagesBoxHelper', function() {
  const buildState = (overrides = {}) => ({
    segments: [{ id: 1, content: 'Page one.', order: 1 }],
    totalPages: 1,
    currentPage: 1,
    ...overrides,
  });

  const buildRefs = () => ({
    boxRef: { current: null },
    bottomSentinelRef: { current: null },
    registerSegmentRef: jasmine.createSpy('registerSegmentRef'),
  });

  describe('.render', function() {
    it('returns null when there are no loaded segments', function() {
      expect(DocumentPagesBoxHelper.render(buildState({ segments: [] }), buildRefs(), 'demo', 9)).toBeNull();
    });

    it('renders the box heading and each segment as markdown', function() {
      const html = renderToStaticMarkup(DocumentPagesBoxHelper.render(
        buildState({
          segments: [
            { id: 1, content: 'Page one.', order: 1 },
            { id: 2, content: 'Page two.', order: 2 },
          ],
        }),
        buildRefs(),
        'demo',
        9,
      ));

      expect(html).toContain('Pages');
      expect(html).toContain('Page one.');
      expect(html).toContain('Page two.');
      expect(html).toContain('border');
    });

    it('preserves line breaks via remark-breaks', function() {
      const html = renderToStaticMarkup(DocumentPagesBoxHelper.render(
        buildState({ segments: [{ id: 1, content: 'Line one.\nLine two.', order: 1 }] }),
        buildRefs(),
        'demo',
        9,
      ));

      expect(html).toContain('Line one.<br');
      expect(html).toContain('Line two.');
    });

    it('tags each segment with its own page number for the visibility observer', function() {
      const html = renderToStaticMarkup(DocumentPagesBoxHelper.render(
        buildState({
          segments: [
            { id: 1, content: 'Page one.', order: 1 },
            { id: 2, content: 'Page two.', order: 2 },
          ],
        }),
        buildRefs(),
        'demo',
        9,
      ));

      expect(html).toContain('data-page="1"');
      expect(html).toContain('data-page="2"');
    });

    it('renders pagination below the box, using the document as the base path', function() {
      const html = renderToStaticMarkup(DocumentPagesBoxHelper.render(
        buildState({ totalPages: 3, currentPage: 2 }),
        buildRefs(),
        'demo',
        9,
      ));

      expect(html).toContain('pagination');
      expect(html).toContain('href="#/games/demo/documents/9?page=1&amp;per_page=1"');
    });

    it('renders no pagination nav when there is only a single page', function() {
      const html = renderToStaticMarkup(DocumentPagesBoxHelper.render(
        buildState({ totalPages: 1, currentPage: 1 }),
        buildRefs(),
        'demo',
        9,
      ));

      expect(html).not.toContain('<nav');
    });
  });
});
