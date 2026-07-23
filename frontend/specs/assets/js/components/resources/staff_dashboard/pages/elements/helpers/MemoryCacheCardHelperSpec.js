import { renderToStaticMarkup } from 'react-dom/server';
import MemoryCacheCardHelper from '../../../../../../../../../assets/js/components/resources/staff_dashboard/pages/elements/helpers/MemoryCacheCardHelper.jsx';

describe('MemoryCacheCardHelper', function() {
  const buildHandlers = () => ({
    onClearCache: jasmine.createSpy('onClearCache'),
    onRefresh: jasmine.createSpy('onRefresh'),
    onDataClick: jasmine.createSpy('onDataClick'),
  });

  describe('.render', function() {
    it('renders the title and a loading indicator while loading', function() {
      const state = { summary: null, status: 'idle', loading: true, error: false };
      const html = renderToStaticMarkup(MemoryCacheCardHelper.render(state, buildHandlers()));

      expect(html).toContain('Memory Cache');
      expect(html).toContain('Loading dashboard...');
    });

    it('renders the percentage once loaded successfully', function() {
      const state = { summary: { size: 30, limit: 100 }, status: 'idle', loading: false, error: false };
      const html = renderToStaticMarkup(MemoryCacheCardHelper.render(state, buildHandlers()));

      expect(html).toContain('30%');
      expect(html).toContain('text-success');
    });

    it('renders a load error message when the summary failed to load', function() {
      const state = { summary: null, status: 'idle', loading: false, error: true };
      const html = renderToStaticMarkup(MemoryCacheCardHelper.render(state, buildHandlers()));

      expect(html).toContain('Unable to load cache summary.');
    });

    it('renders a success feedback message after clearing the cache', function() {
      const state = { summary: { size: 0, limit: 100 }, status: 'success', loading: false, error: false };
      const html = renderToStaticMarkup(MemoryCacheCardHelper.render(state, buildHandlers()));

      expect(html).toContain('Cache cleared successfully.');
    });

    it('renders an error feedback message when clearing the cache fails', function() {
      const state = { summary: { size: 10, limit: 100 }, status: 'error', loading: false, error: false };
      const html = renderToStaticMarkup(MemoryCacheCardHelper.render(state, buildHandlers()));

      expect(html).toContain('Failed to clear cache. Please try again.');
    });

    it('disables the action buttons while an action is in flight', function() {
      const state = { summary: { size: 10, limit: 100 }, status: 'loading', loading: false, error: false };
      const html = renderToStaticMarkup(MemoryCacheCardHelper.render(state, buildHandlers()));

      expect(html).toContain('disabled');
    });

    it('wires the data click handler', function() {
      const state = { summary: { size: 10, limit: 100 }, status: 'idle', loading: false, error: false };
      const handlers = buildHandlers();
      const rendered = MemoryCacheCardHelper.render(state, handlers);
      const top = rendered.props.top;

      top.props.onDataClick();

      expect(handlers.onDataClick).toHaveBeenCalled();
    });

    it('wires the clear-cache and refresh handlers into the actions', function() {
      const state = { summary: { size: 10, limit: 100 }, status: 'idle', loading: false, error: false };
      const handlers = buildHandlers();
      const rendered = MemoryCacheCardHelper.render(state, handlers);
      const cardActions = rendered.props.actions.props.children[0];
      const [clearAction, refreshAction] = cardActions.props.actions;

      expect(clearAction.onClick).toBe(handlers.onClearCache);
      expect(refreshAction.onClick).toBe(handlers.onRefresh);
    });
  });
});
