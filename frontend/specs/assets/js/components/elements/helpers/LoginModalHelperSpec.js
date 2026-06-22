import LoginModalHelper from '../../../../../../assets/js/components/elements/helpers/LoginModalHelper.jsx';
import FormField from '../../../../../../assets/js/components/elements/FormField.jsx';
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
    onForgotPasswordClick: jasmine.createSpy('onForgotPasswordClick'),
    onRegisterClick: jasmine.createSpy('onRegisterClick'),
    onBackToLoginClick: jasmine.createSpy('onBackToLoginClick'),
    onEmailChange: jasmine.createSpy('onEmailChange'),
    onRecoverSubmit: jasmine.createSpy('onRecoverSubmit'),
  });
  const buildState = (overrides = {}) => ({
    username: '',
    password: '',
    incorrect: false,
    error: false,
    mode: 'login',
    email: '',
    recoverySent: false,
    ...overrides,
  });

  describe('.render', function() {
    it('renders the username and password fields and buttons', function() {
      const element = LoginModalHelper.render(true, buildState(), buildHandlers());
      const usernameField = findElement(
        element,
        (child) => child.type === FormField && child.props.id === 'username'
      );
      const passwordField = findElement(
        element,
        (child) => child.type === FormField && child.props.id === 'password'
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
      const element = LoginModalHelper.render(true, buildState({ incorrect: true }), buildHandlers());
      const alert = findElement(
        element,
        (child) => child.type === 'div' && child.props.className === 'alert alert-danger'
      );

      expect(alert.props.children).toBe('User name or password incorrect.');
    });

    it('renders the unexpected error alert', function() {
      const element = LoginModalHelper.render(true, buildState({ error: true }), buildHandlers());
      const alert = findElement(
        element,
        (child) => child.type === 'div' && child.props.className === 'alert alert-danger'
      );

      expect(alert.props.children).toBe('An unexpected error occurred, please try again later.');
    });

    it('renders no alert when there is no error state', function() {
      const element = LoginModalHelper.render(true, buildState(), buildHandlers());
      const alert = findElement(
        element,
        (child) => child.type === 'div' && child.props.className === 'alert alert-danger'
      );

      expect(alert).toBeNull();
    });

    it('wires modal close, cancel, and submit handlers', function() {
      const handlers = buildHandlers();
      const element = LoginModalHelper.render(true, buildState(), handlers);
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
      const element = LoginModalHelper.render(true, buildState(), handlers);
      const usernameField = findElement(
        element,
        (child) => child.type === FormField && child.props.id === 'username'
      );
      const passwordField = findElement(
        element,
        (child) => child.type === FormField && child.props.id === 'password'
      );
      const changeEvent = { target: { value: 'x' } };

      usernameField.props.onChange(changeEvent);
      passwordField.props.onChange(changeEvent);

      expect(handlers.onUsernameChange).toHaveBeenCalledWith(changeEvent);
      expect(handlers.onPasswordChange).toHaveBeenCalledWith(changeEvent);
    });

    it('wires the forgot password link', function() {
      const handlers = buildHandlers();
      const element = LoginModalHelper.render(true, buildState(), handlers);
      const forgotLink = findElement(
        element,
        (child) => child.type === 'button' && child.props.children === 'Forgot password?'
      );

      forgotLink.props.onClick();

      expect(handlers.onForgotPasswordClick).toHaveBeenCalled();
    });

    it('wires the register link', function() {
      const handlers = buildHandlers();
      const element = LoginModalHelper.render(true, buildState(), handlers);
      const registerLink = findElement(
        element,
        (child) => child.type === 'button' && child.props.children === 'Create an account'
      );

      registerLink.props.onClick();

      expect(handlers.onRegisterClick).toHaveBeenCalled();
    });

    it('renders the recover-password email form in recover mode', function() {
      const element = LoginModalHelper.render(true, buildState({ mode: 'recover' }), buildHandlers());
      const emailField = findElement(
        element,
        (child) => child.type === FormField && child.props.id === 'recover-email'
      );
      const sendButton = findElement(
        element,
        (child) => child.type === 'button' && child.props.children === 'Send recovery email'
      );
      const backButton = findElement(
        element,
        (child) => child.type === 'button' && child.props.children === 'Back to login'
      );

      expect(emailField.props.type).toBe('email');
      expect(sendButton).not.toBeNull();
      expect(backButton).not.toBeNull();
    });

    it('wires recover-mode email change, submit, and back handlers', function() {
      const handlers = buildHandlers();
      const element = LoginModalHelper.render(true, buildState({ mode: 'recover' }), handlers);
      const emailField = findElement(
        element,
        (child) => child.type === FormField && child.props.id === 'recover-email'
      );
      const backButton = findElement(
        element,
        (child) => child.type === 'button' && child.props.children === 'Back to login'
      );
      const form = findElement(element, (child) => child.type === 'form');
      const changeEvent = { target: { value: 'user@example.com' } };
      const submitEvent = { preventDefault: jasmine.createSpy('preventDefault') };

      emailField.props.onChange(changeEvent);
      backButton.props.onClick();
      form.props.onSubmit(submitEvent);

      expect(handlers.onEmailChange).toHaveBeenCalledWith(changeEvent);
      expect(handlers.onBackToLoginClick).toHaveBeenCalled();
      expect(handlers.onRecoverSubmit).toHaveBeenCalledWith(submitEvent);
    });

    it('renders the confirmation message when the recovery email has been sent', function() {
      const element = LoginModalHelper.render(
        true,
        buildState({ mode: 'recover', recoverySent: true }),
        buildHandlers()
      );
      const confirmation = findElement(
        element,
        (child) => child.type === 'div' && child.props.className === 'alert alert-info'
      );
      const emailField = findElement(
        element,
        (child) => child.type === FormField && child.props.id === 'recover-email'
      );

      expect(confirmation.props.children).toBe('If that email is registered, a recovery link has been sent.');
      expect(emailField).toBeNull();
    });

    it('wires the back-to-login handler on the confirmation screen', function() {
      const handlers = buildHandlers();
      const element = LoginModalHelper.render(
        true,
        buildState({ mode: 'recover', recoverySent: true }),
        handlers
      );
      const backButton = findElement(
        element,
        (child) => child.type === 'button' && child.props.children === 'Back to login'
      );

      backButton.props.onClick();

      expect(handlers.onBackToLoginClick).toHaveBeenCalled();
    });
  });
});
