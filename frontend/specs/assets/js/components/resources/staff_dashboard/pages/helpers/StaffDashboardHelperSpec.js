import { renderToStaticMarkup } from 'react-dom/server';
import StaffDashboardHelper from '../../../../../../../../assets/js/components/resources/staff_dashboard/pages/helpers/StaffDashboardHelper.jsx';
import dashboardCardConfig from '../../../../../../../../assets/js/components/resources/staff_dashboard/pages/dashboardCardConfig.js';

describe('StaffDashboardHelper', function() {
  describe('.render', function() {
    it('renders the page title', function() {
      const html = renderToStaticMarkup(StaffDashboardHelper.render());

      expect(html).toContain('Staff Dashboard');
    });

    it('renders one grid column per configured dashboard card', function() {
      const rendered = StaffDashboardHelper.render();
      const row = rendered.props.children[2];

      expect(row.props.children.length).toBe(dashboardCardConfig.length);
    });

    it('renders each configured card component', function() {
      const html = renderToStaticMarkup(StaffDashboardHelper.render());

      expect(html).toContain('Memory Cache');
    });

    it('uses the 4-per-row column classes', function() {
      const rendered = StaffDashboardHelper.render();
      const row = rendered.props.children[2];
      const column = row.props.children[0];

      expect(column.props.className).toBe('col-6 col-sm-4 col-md-3 col-lg-3 mb-4');
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
