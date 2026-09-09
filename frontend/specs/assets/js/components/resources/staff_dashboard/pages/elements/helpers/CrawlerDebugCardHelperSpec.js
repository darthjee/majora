import { renderToStaticMarkup } from 'react-dom/server';
import CrawlerDebugCardHelper from '../../../../../../../../../assets/js/components/resources/staff_dashboard/pages/elements/helpers/CrawlerDebugCardHelper.jsx';

describe('CrawlerDebugCardHelper', function() {
  const buildHandlers = () => ({
    onClearCache: jasmine.createSpy('onClearCache'),
    onRefresh: jasmine.createSpy('onRefresh'),
  });

  describe('.render', function() {
    it('renders the title and a loading indicator while loading', function() {
      const state = { counts: null, status: 'idle', loading: true, error: false };
      const html = renderToStaticMarkup(CrawlerDebugCardHelper.render(state, buildHandlers()));

      expect(html).toContain('Crawler Debug');
      expect(html).toContain('Loading dashboard...');
    });

    it('renders the per-type counts sorted by type with a computed total', function() {
      const state = {
        counts: { stl_model: 42, collection: 7 },
        status: 'idle',
        loading: false,
        error: false,
      };
      const html = renderToStaticMarkup(CrawlerDebugCardHelper.render(state, buildHandlers()));

      expect(html).toContain('collection');
      expect(html).toContain('stl_model');
      expect(html.indexOf('collection')).toBeLessThan(html.indexOf('stl_model'));
      expect(html).toContain('49');
    });

    it('renders the empty-state message when there are no counts', function() {
      const state = { counts: {}, status: 'idle', loading: false, error: false };
      const html = renderToStaticMarkup(CrawlerDebugCardHelper.render(state, buildHandlers()));

      expect(html).toContain('No entries yet');
    });

    it('renders a load error message when the summary failed to load', function() {
      const state = { counts: null, status: 'idle', loading: false, error: true };
      const html = renderToStaticMarkup(CrawlerDebugCardHelper.render(state, buildHandlers()));

      expect(html).toContain('Unable to load crawler summary.');
    });

    it('renders a success feedback message after clearing the entries', function() {
      const state = { counts: {}, status: 'success', loading: false, error: false };
      const html = renderToStaticMarkup(CrawlerDebugCardHelper.render(state, buildHandlers()));

      expect(html).toContain('Crawler entries cleared successfully.');
    });

    it('renders an error feedback message when clearing the entries fails', function() {
      const state = { counts: { stl_model: 1 }, status: 'error', loading: false, error: false };
      const html = renderToStaticMarkup(CrawlerDebugCardHelper.render(state, buildHandlers()));

      expect(html).toContain('Failed to clear crawler entries. Please try again.');
    });

    it('disables the action buttons while an action is in flight', function() {
      const state = { counts: { stl_model: 1 }, status: 'loading', loading: false, error: false };
      const rendered = CrawlerDebugCardHelper.render(state, buildHandlers());
      const [clearAction, refreshAction] = rendered.props.actions.props.children[0].props.actions;

      expect(clearAction.disabled).toBe(true);
      expect(refreshAction.disabled).toBe(true);
    });

    it('wires the clear and refresh handlers into the actions', function() {
      const state = { counts: { stl_model: 1 }, status: 'idle', loading: false, error: false };
      const handlers = buildHandlers();
      const rendered = CrawlerDebugCardHelper.render(state, handlers);
      const [clearAction, refreshAction] = rendered.props.actions.props.children[0].props.actions;

      expect(clearAction.onClick).toBe(handlers.onClearCache);
      expect(refreshAction.onClick).toBe(handlers.onRefresh);
    });

    it('uses distinct icons for the clear and refresh actions', function() {
      const state = { counts: { stl_model: 1 }, status: 'idle', loading: false, error: false };
      const html = renderToStaticMarkup(CrawlerDebugCardHelper.render(state, buildHandlers()));

      expect(html).toContain('bi-trash-fill');
      expect(html).toContain('bi-arrow-clockwise');
    });
  });
});
