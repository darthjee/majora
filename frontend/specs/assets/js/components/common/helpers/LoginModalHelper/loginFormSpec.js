import LoginModalHelper from '../../../../../../../assets/js/components/common/helpers/LoginModalHelper.jsx';
import FormField from '../../../../../../../assets/js/components/common/FormField.jsx';
import Modal from 'react-bootstrap/cjs/Modal.js';
import { buildHandlers, buildState, findElement } from './support.js';

describe('LoginModalHelper', function() {
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
  });
});
