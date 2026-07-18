import { renderToStaticMarkup } from 'react-dom/server';
import RegisterHelper from '../../../../../../../../assets/js/components/resources/account/pages/helpers/RegisterHelper.jsx';

describe('RegisterHelper', function() {
  const buildHandlers = () => ({
    onSubmit: jasmine.createSpy('onSubmit'),
    onNameChange: jasmine.createSpy('onNameChange'),
    onDisplayNameChange: jasmine.createSpy('onDisplayNameChange'),
    onEmailChange: jasmine.createSpy('onEmailChange'),
    onPasswordChange: jasmine.createSpy('onPasswordChange'),
    onPasswordConfirmationChange: jasmine.createSpy('onPasswordConfirmationChange'),
  });
  const buildState = (overrides = {}) => ({
    name: '',
    displayName: '',
    email: '',
    password: '',
    passwordConfirmation: '',
    status: 'idle',
    ...overrides,
  });

  describe('.render', function() {
    it('renders the name, display name, email, password, and confirmation fields', function() {
      const html = renderToStaticMarkup(RegisterHelper.render(buildState(), buildHandlers()));

      expect(html).toContain('id="register-name"');
      expect(html).toContain('id="register-display-name"');
      expect(html).toContain('id="register-email"');
      expect(html).toContain('id="register-password"');
      expect(html).toContain('id="register-password-confirmation"');
      expect(html).toContain('Register');
    });

    it('renders a translated error message when status is error', function() {
      const html = renderToStaticMarkup(
        RegisterHelper.render(buildState({ status: 'error' }), buildHandlers())
      );

      expect(html).toContain('An unexpected error occurred, please try again later.');
      expect(html).toContain('alert-danger');
    });

    it('renders no error message when status is idle', function() {
      const html = renderToStaticMarkup(RegisterHelper.render(buildState(), buildHandlers()));

      expect(html).not.toContain('alert-danger');
    });
  });
});
