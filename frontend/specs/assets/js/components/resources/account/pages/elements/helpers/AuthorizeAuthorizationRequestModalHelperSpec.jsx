import AuthorizeAuthorizationRequestModalHelper from '../../../../../../../../../assets/js/components/resources/account/pages/elements/helpers/AuthorizeAuthorizationRequestModalHelper.jsx';
import Modal from 'react-bootstrap/cjs/Modal.js';
import FormField from '../../../../../../../../../assets/js/components/common/forms/FormField.jsx';

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

describe('AuthorizeAuthorizationRequestModalHelper', function() {
  const buildHandlers = () => ({
    onPasswordChange: jasmine.createSpy('onPasswordChange'),
    onConfirm: jasmine.createSpy('onConfirm'),
    onCancel: jasmine.createSpy('onCancel'),
  });

  describe('.render', function() {
    it('renders the authorize title and body', function() {
      const element = AuthorizeAuthorizationRequestModalHelper.render(
        true, null, { password: '', error: false }, buildHandlers(),
      );
      const title = findElement(element, (child) => child.type === Modal.Title);

      expect(title.props.children).toBe('Authorize login request');
      expect(JSON.stringify(element)).toContain('own');
    });

    it('renders the ip/browser info when a request is given', function() {
      const request = { ip: '203.0.113.5', browser: 'Firefox' };
      const element = AuthorizeAuthorizationRequestModalHelper.render(
        true, request, { password: '', error: false }, buildHandlers(),
      );

      expect(JSON.stringify(element)).toContain('203.0.113.5');
      expect(JSON.stringify(element)).toContain('Firefox');
    });

    it('renders the password field', function() {
      const element = AuthorizeAuthorizationRequestModalHelper.render(
        true, null, { password: 'secret', error: false }, buildHandlers(),
      );
      const passwordField = findElement(
        element,
        (child) => child.type === FormField && child.props.id === 'authorize-request-password'
      );

      expect(passwordField.props.type).toBe('password');
      expect(passwordField.props.value).toBe('secret');
    });

    it('renders no error alert when there is no error', function() {
      const element = AuthorizeAuthorizationRequestModalHelper.render(
        true, null, { password: '', error: false }, buildHandlers(),
      );
      const alert = findElement(
        element,
        (child) => child.type === 'div' && child.props.className === 'alert alert-danger'
      );

      expect(alert).toBeNull();
    });

    it('renders the error alert when authorization fails', function() {
      const element = AuthorizeAuthorizationRequestModalHelper.render(
        true, null, { password: '', error: true }, buildHandlers(),
      );
      const alert = findElement(
        element,
        (child) => child.type === 'div' && child.props.className === 'alert alert-danger'
      );

      expect(alert.props.children).toBe('Failed to update the authorization request. Please try again.');
    });

    it('wires the password change, cancel, and confirm handlers', function() {
      const handlers = buildHandlers();
      const element = AuthorizeAuthorizationRequestModalHelper.render(
        true, null, { password: '', error: false }, handlers,
      );
      const passwordField = findElement(
        element,
        (child) => child.type === FormField && child.props.id === 'authorize-request-password'
      );
      const cancelButton = findElement(
        element,
        (child) => child.type === 'button' && child.props.children === 'Cancel'
      );
      const confirmButton = findElement(
        element,
        (child) => child.type === 'button' && child.props.children === 'Authorize'
      );
      const changeEvent = { target: { value: 'x' } };

      passwordField.props.onChange(changeEvent);
      cancelButton.props.onClick();
      confirmButton.props.onClick();

      expect(handlers.onPasswordChange).toHaveBeenCalledWith(changeEvent);
      expect(handlers.onCancel).toHaveBeenCalled();
      expect(handlers.onConfirm).toHaveBeenCalled();
    });

    it('wires the modal onHide to the cancel handler', function() {
      const handlers = buildHandlers();
      const element = AuthorizeAuthorizationRequestModalHelper.render(
        true, null, { password: '', error: false }, handlers,
      );
      const modal = findElement(element, (child) => child.type === Modal);

      modal.props.onHide();

      expect(handlers.onCancel).toHaveBeenCalled();
    });
  });
});
