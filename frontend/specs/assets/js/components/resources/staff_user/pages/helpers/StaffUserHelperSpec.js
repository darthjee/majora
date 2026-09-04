import { renderToStaticMarkup } from 'react-dom/server';
import StaffUserHelper from '../../../../../../../../assets/js/components/resources/staff_user/pages/helpers/StaffUserHelper.jsx';

describe('StaffUserHelper', function() {
  const user = {
    id: 1, name: 'Jane', email: 'jane@example.com', status: 'approved',
  };

  describe('.render', function() {
    it('renders the user name and email', function() {
      const html = renderToStaticMarkup(StaffUserHelper.render(user));

      expect(html).toContain('Jane');
      expect(html).toContain('jane@example.com');
    });

    it('renders an edit link', function() {
      const html = renderToStaticMarkup(StaffUserHelper.render(user));

      expect(html).toContain('href="#/staff/users/1/edit"');
    });

    it('renders a back button to the users index', function() {
      const html = renderToStaticMarkup(StaffUserHelper.render(user));

      expect(html).toContain('href="#/staff/users"');
    });

    it('renders the status badge with its translated label', function() {
      const html = renderToStaticMarkup(StaffUserHelper.render(user));

      expect(html).toContain('Status');
      expect(html).toContain('Approved');
      expect(html).toContain('bg-success');
    });

    it('renders successfully while the recovery-token panel slot contributes nothing', function() {
      const html = renderToStaticMarkup(StaffUserHelper.render(user));

      expect(html).toContain('href="#/staff/users/1/edit"');
    });
  });

  describe('.renderLoading', function() {
    it('renders the loading message', function() {
      const html = renderToStaticMarkup(StaffUserHelper.renderLoading());
      expect(html).toContain('Loading user...');
    });
  });

  describe('.renderError', function() {
    it('renders the translated error message', function() {
      const html = renderToStaticMarkup(StaffUserHelper.renderError());
      expect(html).toContain('Failed to load user. Please try again.');
    });
  });
});
