import LoginModalHelper from '../../../../../../../assets/js/components/common/helpers/LoginModalHelper.jsx';
import FormField from '../../../../../../../assets/js/components/common/FormField.jsx';
import { buildHandlers, buildState, findElement } from './support.js';

describe('LoginModalHelper', function() {
  describe('.render', function() {
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
