import LoginModalHelper from '../../../../../../assets/js/components/elements/helpers/LoginModalHelper.jsx';
import Modal from 'react-bootstrap/cjs/Modal.js';

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

describe('LoginModalHelper', function() {
  const buildHandlers = () => ({
    onClose: jasmine.createSpy('onClose'),
    onCancel: jasmine.createSpy('onCancel'),
    onSubmit: jasmine.createSpy('onSubmit'),
    onUsernameChange: jasmine.createSpy('onUsernameChange'),
    onPasswordChange: jasmine.createSpy('onPasswordChange'),
  });

  describe('.render', function() {
    it('renders the username and password fields and buttons', function() {
      const element = LoginModalHelper.render(true, {
        username: '',
        password: '',
        incorrect: false,
        error: false,
      }, buildHandlers());
      const usernameField = findElement(
        element,
        (child) => child.type === 'input' && child.props.id === 'username'
      );
      const passwordField = findElement(
        element,
        (child) => child.type === 'input' && child.props.id === 'password'
      );
      const cancelButton = findElement(
        element,
        (child) => child.type === 'button' && child.props.children === 'Cancel'
      );

      expect(usernameField.props.type).toBe('text');
      expect(passwordField.props.type).toBe('password');
      expect(cancelButton).not.toBeNull();
    });

    it('renders the incorrect credentials alert', function() {
      const element = LoginModalHelper.render(true, {
        username: '',
        password: '',
        incorrect: true,
        error: false,
      }, buildHandlers());
      const alert = findElement(
        element,
        (child) => child.type === 'div' && child.props.className === 'alert alert-danger'
      );

      expect(alert.props.children).toBe('User name or password incorrect.');
    });

    it('renders the unexpected error alert', function() {
      const element = LoginModalHelper.render(true, {
        username: '',
        password: '',
        incorrect: false,
        error: true,
      }, buildHandlers());
      const alert = findElement(
        element,
        (child) => child.type === 'div' && child.props.className === 'alert alert-danger'
      );

      expect(alert.props.children).toBe('An unexpected error occurred, please try again later.');
    });

    it('renders no alert when there is no error state', function() {
      const element = LoginModalHelper.render(true, {
        username: '',
        password: '',
        incorrect: false,
        error: false,
      }, buildHandlers());
      const alert = findElement(
        element,
        (child) => child.type === 'div' && child.props.className === 'alert alert-danger'
      );

      expect(alert).toBeNull();
    });

    it('wires modal close, cancel, and submit handlers', function() {
      const handlers = buildHandlers();
      const element = LoginModalHelper.render(true, {
        username: '',
        password: '',
        incorrect: false,
        error: false,
      }, handlers);
      const modal = findElement(element, (child) => child.type === Modal);
      const cancelButton = findElement(
        element,
        (child) => child.type === 'button' && child.props.children === 'Cancel'
      );
      const form = findElement(element, (child) => child.type === 'form');
      const submitEvent = { preventDefault: jasmine.createSpy('preventDefault') };

      modal.props.onHide();
      cancelButton.props.onClick();
      form.props.onSubmit(submitEvent);

      expect(handlers.onClose).toHaveBeenCalled();
      expect(handlers.onCancel).toHaveBeenCalled();
      expect(handlers.onSubmit).toHaveBeenCalledWith(submitEvent);
    });

    it('wires username and password change handlers', function() {
      const handlers = buildHandlers();
      const element = LoginModalHelper.render(true, {
        username: '',
        password: '',
        incorrect: false,
        error: false,
      }, handlers);
      const usernameField = findElement(
        element,
        (child) => child.type === 'input' && child.props.id === 'username'
      );
      const passwordField = findElement(
        element,
        (child) => child.type === 'input' && child.props.id === 'password'
      );
      const changeEvent = { target: { value: 'x' } };

      usernameField.props.onChange(changeEvent);
      passwordField.props.onChange(changeEvent);

      expect(handlers.onUsernameChange).toHaveBeenCalledWith(changeEvent);
      expect(handlers.onPasswordChange).toHaveBeenCalledWith(changeEvent);
    });
  });
});
