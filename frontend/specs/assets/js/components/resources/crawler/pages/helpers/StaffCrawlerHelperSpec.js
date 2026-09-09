import { renderToStaticMarkup } from 'react-dom/server';
import StaffCrawlerHelper
  from '../../../../../../../../assets/js/components/resources/crawler/pages/helpers/StaffCrawlerHelper.jsx';
import Noop from '../../../../../../../../assets/js/utils/Noop.js';

describe('StaffCrawlerHelper', function() {
  const buildEmissions = () => ([
    {
      id: 1, created_at: '2026-01-01T00:00:00Z', source: 'lootstudios', type: 'candidate', payload: { a: 1 },
    },
    {
      id: 2, created_at: '2026-01-02T00:00:00Z', source: 'myminifactory', type: 'imported', payload: { b: 2 },
    },
  ]);
  const feedProps = { feedRef: { current: null }, onScroll: Noop.noop };

  describe('.render', function() {
    it('renders the page title', function() {
      const html = renderToStaticMarkup(StaffCrawlerHelper.render([], null, Noop.noop, feedProps));

      expect(html).toContain('Crawler Debug Feed');
    });

    it('renders one feed row per emission with its id, source, and type', function() {
      const html = renderToStaticMarkup(StaffCrawlerHelper.render(buildEmissions(), null, Noop.noop, feedProps));

      expect(html).toContain('1');
      expect(html).toContain('lootstudios');
      expect(html).toContain('candidate');
      expect(html).toContain('2');
      expect(html).toContain('myminifactory');
      expect(html).toContain('imported');
    });

    it('highlights the selected row and leaves the others unhighlighted', function() {
      const rendered = StaffCrawlerHelper.render(buildEmissions(), 2, Noop.noop, feedProps);
      const feedColumn = rendered.props.children[2].props.children[0];
      const rows = feedColumn.props.children.props.children;

      expect(rows[0].props.className).not.toContain('active');
      expect(rows[1].props.className).toContain('active');
    });

    it('calls onSelect with the row id when a row is clicked', function() {
      const onSelect = jasmine.createSpy('onSelect');
      const rendered = StaffCrawlerHelper.render(buildEmissions(), null, onSelect, feedProps);
      const feedColumn = rendered.props.children[2].props.children[0];
      const rows = feedColumn.props.children.props.children;

      rows[0].props.onClick();

      expect(onSelect).toHaveBeenCalledWith(1);
    });

    it('renders a placeholder message when nothing is selected', function() {
      const html = renderToStaticMarkup(StaffCrawlerHelper.render(buildEmissions(), null, Noop.noop, feedProps));

      expect(html).toContain('Select a record from the feed to view its full payload.');
    });

    it('renders the selected emission as pretty-printed JSON', function() {
      const rendered = StaffCrawlerHelper.render(buildEmissions(), 1, Noop.noop, feedProps);
      const detailColumn = rendered.props.children[2].props.children[1];
      const pre = detailColumn.props.children;

      expect(pre.props.children).toBe(JSON.stringify(buildEmissions()[0], null, 2));
    });
  });

  describe('.renderLoading', function() {
    it('renders the loading message', function() {
      const html = renderToStaticMarkup(StaffCrawlerHelper.renderLoading());

      expect(html).toContain('Loading crawler feed...');
    });
  });

  describe('.renderError', function() {
    it('renders the given error message', function() {
      const html = renderToStaticMarkup(StaffCrawlerHelper.renderError('boom'));

      expect(html).toContain('boom');
    });
  });
});
