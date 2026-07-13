import { renderToStaticMarkup } from 'react-dom/server';
import PaginationHelper from '../../../../../../assets/js/components/common/helpers/PaginationHelper.jsx';

describe('PaginationHelper', function() {
  describe('.render', function() {
    it('returns null when there is only one page', function() {
      expect(PaginationHelper.render(1, 1, 10, '#/games')).toBeNull();
    });

    it('returns null when totalPages is zero', function() {
      expect(PaginationHelper.render(1, 0, 10, '#/games')).toBeNull();
    });

    it('renders a nav element', function() {
      const html = renderToStaticMarkup(PaginationHelper.render(1, 5, 10, '#/games'));
      expect(html).toContain('<nav');
    });

    it('renders pagination list', function() {
      const html = renderToStaticMarkup(PaginationHelper.render(1, 5, 10, '#/games'));
      expect(html).toContain('pagination');
    });

    it('marks the current page as active', function() {
      const html = renderToStaticMarkup(PaginationHelper.render(3, 5, 10, '#/games'));
      expect(html).toContain('page-item active');
    });

    it('renders disabled previous button on the first page', function() {
      const html = renderToStaticMarkup(PaginationHelper.render(1, 5, 10, '#/games'));
      expect(html).toContain('disabled');
      expect(html).toContain('«');
    });

    it('renders disabled next button on the last page', function() {
      const html = renderToStaticMarkup(PaginationHelper.render(5, 5, 10, '#/games'));
      expect(html).toContain('»');
    });

    it('renders gap ellipsis for large page counts', function() {
      const html = renderToStaticMarkup(PaginationHelper.render(10, 50, 10, '#/games'));
      expect(html).toContain('…');
    });

    it('builds links using the basePath', function() {
      const html = renderToStaticMarkup(PaginationHelper.render(2, 5, 10, '#/games'));
      expect(html).toContain('#/games?page=');
    });

    it('preserves extra params on pagination links when provided', function() {
      const html = renderToStaticMarkup(
        PaginationHelper.render(2, 5, 10, '#/games/demo/npcs', { slain: 'true', name: 'gob' })
      );
      expect(html).toContain('slain=true');
      expect(html).toContain('name=gob');
    });

    it('omits extra params on pagination links when not provided', function() {
      const html = renderToStaticMarkup(PaginationHelper.render(2, 5, 10, '#/games/demo/npcs'));
      expect(html).not.toContain('slain');
      expect(html).not.toContain('name=');
    });
  });
});
