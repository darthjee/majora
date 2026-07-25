import { renderToStaticMarkup } from 'react-dom/server';
import AuthorizationRequestsHelper from '../../../../../../../../assets/js/components/resources/account/pages/helpers/AuthorizationRequestsHelper.jsx';
import DenyAuthorizationRequestModal from '../../../../../../../../assets/js/components/resources/account/pages/elements/DenyAuthorizationRequestModal.jsx';
import AuthorizeAuthorizationRequestModal from '../../../../../../../../assets/js/components/resources/account/pages/elements/AuthorizeAuthorizationRequestModal.jsx';

const findElement = (node, matcher) => {
  if (!node) {
    return null;
  }

  if (Array.isArray(node)) {
    for (const child of node) {
      const match = findElement(child, matcher);

      if (match) {
        return match;
      }
    }

    return null;
  }

  if (typeof node !== 'object') {
    return null;
  }

  if (matcher(node)) {
    return node;
  }

  return findElement(node.props?.children, matcher);
};

describe('AuthorizationRequestsHelper', function() {
  const pagination = { page: 1, pages: 1, perPage: 10 };
  const buildHandlers = () => ({
    onOpenDeny: jasmine.createSpy('onOpenDeny'),
    onOpenAuthorize: jasmine.createSpy('onOpenAuthorize'),
    onCloseModals: jasmine.createSpy('onCloseModals'),
    onDenyConfirm: jasmine.createSpy('onDenyConfirm'),
    onAuthorizeConfirm: jasmine.createSpy('onAuthorizeConfirm'),
    onPasswordChange: jasmine.createSpy('onPasswordChange'),
  });
  const buildState = (overrides = {}) => ({
    denyTarget: null,
    authorizeTarget: null,
    password: '',
    authorizeError: false,
    ...overrides,
  });

  describe('.render', function() {
    it('renders the uuid, formatted date, and status badge columns', function() {
      const requests = [{
        uuid: 'some-uuid', created_at: '2024-01-15T10:30:00Z', status: 'open', ip: '203.0.113.5', browser: 'Firefox',
      }];

      const html = renderToStaticMarkup(
        AuthorizationRequestsHelper.render(requests, pagination, buildState(), buildHandlers())
      );

      expect(html).toContain('some-uuid');
      expect(html).toContain('badge');
      expect(html).toContain('Open');
    });

    it('renders the dismiss and authorize actions for an open request', function() {
      const requests = [{
        uuid: 'some-uuid', created_at: '2024-01-15T10:30:00Z', status: 'open', ip: '203.0.113.5', browser: 'Firefox',
      }];

      const html = renderToStaticMarkup(
        AuthorizationRequestsHelper.render(requests, pagination, buildState(), buildHandlers())
      );

      expect(html).toContain('Dismiss');
      expect(html).toContain('Authorize');
    });

    it('does not render actions for a non-open request', function() {
      const requests = [{
        uuid: 'some-uuid', created_at: '2024-01-15T10:30:00Z', status: 'denied', ip: '203.0.113.5', browser: 'Firefox',
      }];

      const html = renderToStaticMarkup(
        AuthorizationRequestsHelper.render(requests, pagination, buildState(), buildHandlers())
      );

      expect(html).not.toContain('Dismiss');
    });

    it('renders pagination', function() {
      const html = renderToStaticMarkup(
        AuthorizationRequestsHelper.render([], { page: 1, pages: 3, perPage: 10 }, buildState(), buildHandlers())
      );

      expect(html).toContain('pagination');
    });

    it('passes the deny target/show state through to the deny modal', function() {
      const request = { uuid: 'some-uuid', ip: '203.0.113.5', browser: 'Firefox' };
      const element = AuthorizationRequestsHelper.render(
        [], pagination, buildState({ denyTarget: request }), buildHandlers()
      );
      const modal = findElement(element, (child) => child.type === DenyAuthorizationRequestModal);

      expect(modal.props.show).toBe(true);
      expect(modal.props.request).toBe(request);
    });

    it('hides the deny modal when there is no deny target', function() {
      const element = AuthorizationRequestsHelper.render([], pagination, buildState(), buildHandlers());
      const modal = findElement(element, (child) => child.type === DenyAuthorizationRequestModal);

      expect(modal.props.show).toBe(false);
    });

    it('passes the authorize target/show state through to the authorize modal', function() {
      const request = { uuid: 'some-uuid', ip: '203.0.113.5', browser: 'Firefox' };
      const state = buildState({ authorizeTarget: request, password: 'secret', authorizeError: true });
      const element = AuthorizationRequestsHelper.render([], pagination, state, buildHandlers());
      const modal = findElement(element, (child) => child.type === AuthorizeAuthorizationRequestModal);

      expect(modal.props.show).toBe(true);
      expect(modal.props.request).toBe(request);
      expect(modal.props.password).toBe('secret');
      expect(modal.props.error).toBe(true);
    });
  });

  describe('.renderLoading', function() {
    it('renders the loading message', function() {
      const html = renderToStaticMarkup(AuthorizationRequestsHelper.renderLoading());

      expect(html).toContain('Loading authorization requests...');
    });
  });
});
