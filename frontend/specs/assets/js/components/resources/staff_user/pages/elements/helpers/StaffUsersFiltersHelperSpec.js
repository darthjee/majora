import { renderToStaticMarkup } from 'react-dom/server';
import StaffUsersFiltersHelper
  from '../../../../../../../../../assets/js/components/resources/staff_user/pages/elements/helpers/StaffUsersFiltersHelper.jsx';
import Noop from '../../../../../../../../../assets/js/utils/Noop.js';

describe('StaffUsersFiltersHelper', function() {
  describe('.render', function() {
    const handlers = {
      onStatusChange: Noop.noop, onSearchChange: Noop.noop, onQuery: Noop.noop, onClear: Noop.noop,
    };

    it('renders the status select, search input, query and clear buttons', function() {
      const html = renderToStaticMarkup(StaffUsersFiltersHelper.render({ status: '', search: '' }, handlers));

      expect(html).toContain('data-testid="staff-users-filters"');
      expect(html).toContain('data-testid="staff-users-filter-status"');
      expect(html).toContain('data-testid="staff-users-filter-search"');
      expect(html).toContain('data-testid="staff-users-filter-query"');
      expect(html).toContain('data-testid="staff-users-filter-clear"');
    });

    it('renders the current status value as selected', function() {
      const html = renderToStaticMarkup(StaffUsersFiltersHelper.render({ status: 'denied', search: '' }, handlers));
      const selectStart = html.indexOf('data-testid="staff-users-filter-status"');

      expect(selectStart).toBeGreaterThan(-1);
      expect(html.indexOf('selected=""', selectStart)).toBeGreaterThan(-1);
    });

    it('renders the current search value', function() {
      const html = renderToStaticMarkup(StaffUsersFiltersHelper.render({ status: '', search: 'jane' }, handlers));

      expect(html).toContain('value="jane"');
    });
  });
});
