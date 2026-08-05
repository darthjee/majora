import { renderToStaticMarkup } from 'react-dom/server';
import DiskCacheCardHelper from '../../../../../../../../../assets/js/components/resources/staff_dashboard/pages/elements/helpers/DiskCacheCardHelper.jsx';

describe('DiskCacheCardHelper', function() {
  const buildHandlers = () => ({
    onClearCache: jasmine.createSpy('onClearCache'),
    onRefresh: jasmine.createSpy('onRefresh'),
  });

  describe('.render', function() {
    it('renders the title and a loading indicator while loading', function() {
      const state = { size: null, status: 'idle', loading: true, error: false };
      const html = renderToStaticMarkup(DiskCacheCardHelper.render(state, buildHandlers()));

      expect(html).toContain('Disk Cache');
      expect(html).toContain('Loading dashboard...');
    });

    it('renders the converted size once loaded successfully', function() {
      const state = { size: 943104, status: 'idle', loading: false, error: false };
      const html = renderToStaticMarkup(DiskCacheCardHelper.render(state, buildHandlers()));

      expect(html).toContain('0.9 MB');
    });

    it('renders a load error message when the size failed to load', function() {
      const state = { size: null, status: 'idle', loading: false, error: true };
      const html = renderToStaticMarkup(DiskCacheCardHelper.render(state, buildHandlers()));

      expect(html).toContain('Unable to load disk cache size.');
      expect(html).toContain('text-danger');
    });

    it('renders a success feedback message after clearing the cache', function() {
      const state = { size: 0, status: 'success', loading: false, error: false };
      const html = renderToStaticMarkup(DiskCacheCardHelper.render(state, buildHandlers()));

      expect(html).toContain('Cache cleared successfully.');
    });

    it('renders an error feedback message when clearing the cache fails', function() {
      const state = { size: 10, status: 'error', loading: false, error: false };
      const html = renderToStaticMarkup(DiskCacheCardHelper.render(state, buildHandlers()));

      expect(html).toContain('Failed to clear cache. Please try again.');
    });

    it('disables the action buttons while an action is in flight', function() {
      const state = { size: 10, status: 'loading', loading: false, error: false };
      const html = renderToStaticMarkup(DiskCacheCardHelper.render(state, buildHandlers()));

      expect(html).toContain('disabled');
    });

    it('wires the clear-cache and refresh handlers into the actions', function() {
      const state = { size: 10, status: 'idle', loading: false, error: false };
      const handlers = buildHandlers();
      const rendered = DiskCacheCardHelper.render(state, handlers);
      const cardActions = rendered.props.actions.props.children[0];
      const [clearAction, refreshAction] = cardActions.props.actions;

      expect(clearAction.onClick).toBe(handlers.onClearCache);
      expect(refreshAction.onClick).toBe(handlers.onRefresh);
    });
  });
});
