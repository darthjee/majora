import LoginModalHelper from '../../../../../../../../assets/js/components/resources/account/helpers/LoginModalHelper.jsx';
import FormField from '../../../../../../../../assets/js/components/common/forms/FormField.jsx';
import { buildHandlers, buildState, findElement } from './support.js';

describe('LoginModalHelper', function() {
  describe('.render', function() {
    it('renders the mode selector radios in login mode', function() {
      const element = LoginModalHelper.render(true, buildState(), buildHandlers());
      const passwordRadio = findElement(
        element,
        (child) => child.type === 'input' && child.props.id === 'login-mode-password'
      );
      const authorizeRadio = findElement(
        element,
        (child) => child.type === 'input' && child.props.id === 'login-mode-authorize'
      );

      expect(passwordRadio.props.checked).toBe(true);
      expect(authorizeRadio.props.checked).toBe(false);
    });

    it('wires the mode selector onChange handlers', function() {
      const handlers = buildHandlers();
      const element = LoginModalHelper.render(true, buildState(), handlers);
      const authorizeRadio = findElement(
        element,
        (child) => child.type === 'input' && child.props.id === 'login-mode-authorize'
      );

      authorizeRadio.props.onChange();

      expect(handlers.onModeChange).toHaveBeenCalledWith('authorize');
    });

    it('renders the username-only form in authorize mode', function() {
      const element = LoginModalHelper.render(true, buildState({ mode: 'authorize' }), buildHandlers());
      const usernameField = findElement(
        element,
        (child) => child.type === FormField && child.props.id === 'authorize-username'
      );
      const passwordField = findElement(
        element,
        (child) => child.type === FormField && child.props.id === 'password'
      );
      const submitButton = findElement(
        element,
        (child) => child.type === 'button' && child.props.children === 'Request authorization'
      );

      expect(usernameField).not.toBeNull();
      expect(passwordField).toBeNull();
      expect(submitButton).not.toBeNull();
    });

    it('wires the authorize-mode submit handler', function() {
      const handlers = buildHandlers();
      const element = LoginModalHelper.render(true, buildState({ mode: 'authorize' }), handlers);
      const form = findElement(element, (child) => child.type === 'form');
      const submitEvent = { preventDefault: jasmine.createSpy('preventDefault') };

      form.props.onSubmit(submitEvent);

      expect(handlers.onAuthorizeSubmit).toHaveBeenCalledWith(submitEvent);
    });

    it('renders the waiting spinner while the authorize request is pending', function() {
      const element = LoginModalHelper.render(
        true,
        buildState({ mode: 'authorize', authorizeStatus: 'waiting' }),
        buildHandlers()
      );
      const spinner = findElement(element, (child) => child.props?.className === 'spinner-border');
      const resetButton = findElement(
        element,
        (child) => child.type === 'button' && child.props.children === 'Request authorization'
      );

      expect(spinner).not.toBeNull();
      expect(resetButton).toBeNull();
    });

    it('renders the retry message while retrying after a transient failure', function() {
      const element = LoginModalHelper.render(
        true,
        buildState({ mode: 'authorize', authorizeStatus: 'retrying' }),
        buildHandlers()
      );
      const message = findElement(
        element,
        (child) => child.type === 'p' && child.props.children === 'Connection lost. Retrying...'
      );

      expect(message).not.toBeNull();
    });

    it('renders the denied outcome with a retry button', function() {
      const handlers = buildHandlers();
      const element = LoginModalHelper.render(
        true,
        buildState({ mode: 'authorize', authorizeStatus: 'denied' }),
        handlers
      );
      const message = findElement(
        element,
        (child) => child.type === 'p' && child.props.children === 'This request was denied.'
      );
      const resetButton = findElement(
        element,
        (child) => child.type === 'button' && child.props.children === 'Request authorization'
      );

      expect(message).not.toBeNull();
      resetButton.props.onClick();
      expect(handlers.onAuthorizeReset).toHaveBeenCalled();
    });

    it('renders the expired outcome', function() {
      const element = LoginModalHelper.render(
        true,
        buildState({ mode: 'authorize', authorizeStatus: 'expired' }),
        buildHandlers()
      );
      const message = findElement(
        element,
        (child) => child.type === 'p' && child.props.children === 'This request has expired. Please try again.'
      );

      expect(message).not.toBeNull();
    });

    it('renders the approved outcome', function() {
      const element = LoginModalHelper.render(
        true,
        buildState({ mode: 'authorize', authorizeStatus: 'approved' }),
        buildHandlers()
      );
      const message = findElement(
        element,
        (child) => child.type === 'p' && child.props.children === 'Approved! Logging you in...'
      );

      expect(message).not.toBeNull();
    });

    it('renders the error outcome', function() {
      const element = LoginModalHelper.render(
        true,
        buildState({ mode: 'authorize', authorizeStatus: 'error' }),
        buildHandlers()
      );
      const message = findElement(
        element,
        (child) => child.type === 'p'
          && child.props.children === 'An unexpected error occurred, please try again later.'
      );

      expect(message).not.toBeNull();
    });

    it('wires the cancel handler on the authorize status view', function() {
      const handlers = buildHandlers();
      const element = LoginModalHelper.render(
        true,
        buildState({ mode: 'authorize', authorizeStatus: 'waiting' }),
        handlers
      );
      const cancelButton = findElement(
        element,
        (child) => child.type === 'button' && child.props.children === 'Cancel'
      );

      cancelButton.props.onClick();

      expect(handlers.onCancel).toHaveBeenCalled();
    });
  });
});
