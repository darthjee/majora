import { renderToStaticMarkup } from 'react-dom/server';
import StaffUsersHelper from '../../../../../../../../assets/js/components/resources/staff_user/pages/helpers/StaffUsersHelper.jsx';

describe('StaffUsersHelper', function() {
  const users = [{ id: 1, name: 'Jane', email: 'jane@example.com' }];
  const pagination = { page: 1, pages: 1, perPage: 10 };
  const buildHandlers = () => ({
    onGenerateRecoveryLink: jasmine.createSpy('onGenerateRecoveryLink'),
    onCopyRecoveryLink: jasmine.createSpy('onCopyRecoveryLink'),
  });

  describe('.render', function() {
    it('renders the name and email columns', function() {
      const html = renderToStaticMarkup(
        StaffUsersHelper.render(users, pagination, {}, buildHandlers())
      );

      expect(html).toContain('Jane');
      expect(html).toContain('jane@example.com');
    });

    it('renders an edit link per row', function() {
      const html = renderToStaticMarkup(
        StaffUsersHelper.render(users, pagination, {}, buildHandlers())
      );

      expect(html).toContain('href="#/staff/users/1/edit"');
    });

    it('renders a generate-link button when no recovery link exists', function() {
      const html = renderToStaticMarkup(
        StaffUsersHelper.render(users, pagination, {}, buildHandlers())
      );

      expect(html).toContain('Generate recovery link');
    });

    it('disables the generate-link button while loading', function() {
      const html = renderToStaticMarkup(
        StaffUsersHelper.render(users, pagination, { 1: { status: 'loading', url: null } }, buildHandlers())
      );

      expect(html).toContain('disabled');
    });

    it('renders the error message and a retry button on failure', function() {
      const html = renderToStaticMarkup(
        StaffUsersHelper.render(users, pagination, { 1: { status: 'error', url: null } }, buildHandlers())
      );

      expect(html).toContain('Failed to generate recovery link. Please try again.');
      expect(html).toContain('Generate recovery link');
    });

    it('renders the recovery link and a copy button when ready', function() {
      const html = renderToStaticMarkup(
        StaffUsersHelper.render(
          users, pagination, { 1: { status: 'ready', url: 'http://example.com/recover' } }, buildHandlers()
        )
      );

      expect(html).toContain('http://example.com/recover');
      expect(html).toContain('Copy link');
    });

    it('renders "Copied!" after the link has been copied', function() {
      const html = renderToStaticMarkup(
        StaffUsersHelper.render(
          users, pagination, { 1: { status: 'copied', url: 'http://example.com/recover' } }, buildHandlers()
        )
      );

      expect(html).toContain('Copied!');
    });

    it('renders pagination', function() {
      const html = renderToStaticMarkup(
        StaffUsersHelper.render(
          users, { page: 1, pages: 3, perPage: 10 }, {}, buildHandlers()
        )
      );

      expect(html).toContain('pagination');
    });
  });

  describe('.renderLoading', function() {
    it('renders the loading message', function() {
      const html = renderToStaticMarkup(StaffUsersHelper.renderLoading());
      expect(html).toContain('Loading users...');
    });
  });

  describe('.renderError', function() {
    it('renders the given error message', function() {
      const html = renderToStaticMarkup(StaffUsersHelper.renderError('boom'));
      expect(html).toContain('boom');
    });
  });
});
