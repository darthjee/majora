import { renderToStaticMarkup } from 'react-dom/server';
import StaffDashboardHelper from '../../../../../../../../assets/js/components/resources/staff_dashboard/pages/helpers/StaffDashboardHelper.jsx';

describe('StaffDashboardHelper', function() {
  const buildHandlers = () => ({
    onClearCache: jasmine.createSpy('onClearCache'),
  });

  describe('.render', function() {
    it('renders the clear-cache button with its icon', function() {
      const html = renderToStaticMarkup(StaffDashboardHelper.render('idle', buildHandlers()));

      expect(html).toContain('bi-database-fill-dash');
    });

    it('feeds the tooltip text to the card hover tooltip content', function() {
      const rendered = StaffDashboardHelper.render('idle', buildHandlers());
      const row = rendered.props.children[2];
      const column = row.props.children;
      const tooltip = column.props.children;

      expect(tooltip.props.content).toBe('Clear Cache');
    });

    it('calls onClearCache when the button is clicked', function() {
      const handlers = buildHandlers();
      const rendered = StaffDashboardHelper.render('idle', handlers);
      const row = rendered.props.children[2];
      const column = row.props.children;
      const tooltip = column.props.children;
      const button = tooltip.props.children;

      button.props.onClick();

      expect(handlers.onClearCache).toHaveBeenCalled();
    });

    it('disables the button while the clear-cache request is in flight', function() {
      const html = renderToStaticMarkup(StaffDashboardHelper.render('loading', buildHandlers()));

      expect(html).toContain('disabled');
    });

    it('renders a success message once the cache has been cleared', function() {
      const html = renderToStaticMarkup(StaffDashboardHelper.render('success', buildHandlers()));

      expect(html).toContain('Cache cleared successfully.');
    });

    it('renders an error message when clearing the cache fails', function() {
      const html = renderToStaticMarkup(StaffDashboardHelper.render('error', buildHandlers()));

      expect(html).toContain('Failed to clear cache. Please try again.');
    });

    it('renders no feedback message while idle', function() {
      const html = renderToStaticMarkup(StaffDashboardHelper.render('idle', buildHandlers()));

      expect(html).not.toContain('Cache cleared successfully.');
      expect(html).not.toContain('Failed to clear cache. Please try again.');
    });
  });

  describe('.renderLoading', function() {
    it('renders the loading message', function() {
      const html = renderToStaticMarkup(StaffDashboardHelper.renderLoading());
      expect(html).toContain('Loading dashboard...');
    });
  });

  describe('.renderError', function() {
    it('renders the given error message', function() {
      const html = renderToStaticMarkup(StaffDashboardHelper.renderError('boom'));
      expect(html).toContain('boom');
    });
  });
});
