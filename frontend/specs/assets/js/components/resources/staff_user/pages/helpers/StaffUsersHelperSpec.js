import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import StaffUsersHelper from '../../../../../../../../assets/js/components/resources/staff_user/pages/helpers/StaffUsersHelper.jsx';

describe('StaffUsersHelper', function() {
  const users = [{
    id: 1, name: 'Jane', email: 'jane@example.com', display_name: 'Janie', status: 'pending',
  }];
  const pagination = { page: 1, pages: 1, perPage: 10 };
  const buildHandlers = () => ({
    onGenerateRecoveryLink: jasmine.createSpy('onGenerateRecoveryLink'),
    onCopyRecoveryLink: jasmine.createSpy('onCopyRecoveryLink'),
    onApprove: jasmine.createSpy('onApprove'),
    onDeny: jasmine.createSpy('onDeny'),
  });

  describe('.render', function() {
    it('renders the name and email columns', function() {
      const html = renderToStaticMarkup(
        StaffUsersHelper.render(users, pagination, {}, buildHandlers())
      );

      expect(html).toContain('Jane');
      expect(html).toContain('jane@example.com');
    });

    it('links the name cell to the user detail page', function() {
      const html = renderToStaticMarkup(
        StaffUsersHelper.render(users, pagination, {}, buildHandlers())
      );

      expect(html).toContain('<a href="#/staff/users/1">Jane</a>');
    });

    it('renders the display name column', function() {
      const html = renderToStaticMarkup(
        StaffUsersHelper.render(users, pagination, {}, buildHandlers())
      );

      expect(html).toContain('Janie');
    });

    it('renders the status badge', function() {
      const html = renderToStaticMarkup(
        StaffUsersHelper.render(users, pagination, {}, buildHandlers())
      );

      expect(html).toContain('bg-warning');
      expect(html).toContain('Pending');
    });

    it('renders an edit link per row', function() {
      const html = renderToStaticMarkup(
        StaffUsersHelper.render(users, pagination, {}, buildHandlers())
      );

      expect(html).toContain('href="#/staff/users/1/edit"');
    });

    it('renders an Approve action for a pending user', function() {
      const html = renderToStaticMarkup(
        StaffUsersHelper.render(users, pagination, {}, buildHandlers())
      );

      expect(html).toContain('btn-success');
    });

    it('does not render an Approve action for an approved user', function() {
      const approvedUsers = [{ ...users[0], status: 'approved' }];
      const html = renderToStaticMarkup(
        StaffUsersHelper.render(approvedUsers, pagination, {}, buildHandlers())
      );

      expect(html).not.toContain('btn-success');
    });

    it('renders a Deny action regardless of status', function() {
      const approvedUsers = [{ ...users[0], status: 'approved' }];
      const html = renderToStaticMarkup(
        StaffUsersHelper.render(approvedUsers, pagination, {}, buildHandlers())
      );

      expect(html).toContain('Deny');
    });

    it('renders the given filters element', function() {
      const filters = React.createElement('div', { 'data-testid': 'the-filters' });
      const html = renderToStaticMarkup(
        StaffUsersHelper.render(users, pagination, {}, buildHandlers(), filters)
      );

      expect(html).toContain('data-testid="the-filters"');
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
