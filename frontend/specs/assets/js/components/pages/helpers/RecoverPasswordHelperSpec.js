import { renderToStaticMarkup } from 'react-dom/server';
import RecoverPasswordHelper from '../../../../../../assets/js/components/pages/helpers/RecoverPasswordHelper.jsx';

describe('RecoverPasswordHelper', function() {
  const buildHandlers = () => ({
    onSubmit: jasmine.createSpy('onSubmit'),
    onPasswordChange: jasmine.createSpy('onPasswordChange'),
    onConfirmPasswordChange: jasmine.createSpy('onConfirmPasswordChange'),
  });
  const buildState = (overrides = {}) => ({
    password: '',
    confirmPassword: '',
    status: 'idle',
    errorMessage: '',
    ...overrides,
  });

  describe('.render', function() {
    it('renders the password and confirm-password fields', function() {
      const html = renderToStaticMarkup(RecoverPasswordHelper.render(buildState(), buildHandlers()));

      expect(html).toContain('id="new-password"');
      expect(html).toContain('id="confirm-password"');
      expect(html).toContain('Reset password');
    });

    it('renders the error message when status is error', function() {
      const html = renderToStaticMarkup(
        RecoverPasswordHelper.render(buildState({ status: 'error', errorMessage: 'Invalid or expired token' }), buildHandlers())
      );

      expect(html).toContain('Invalid or expired token');
      expect(html).toContain('alert-danger');
    });

    it('renders no error message when status is idle', function() {
      const html = renderToStaticMarkup(RecoverPasswordHelper.render(buildState(), buildHandlers()));

      expect(html).not.toContain('alert-danger');
    });

    it('renders a link back to home instead of the form on success', function() {
      const html = renderToStaticMarkup(RecoverPasswordHelper.render(buildState({ status: 'success' }), buildHandlers()));

      expect(html).toContain('Your password has been reset.');
      expect(html).toContain('href="#/"');
      expect(html).not.toContain('id="new-password"');
    });

    it('wires the submit and change handlers', function() {
      const handlers = buildHandlers();

      RecoverPasswordHelper.render(buildState(), handlers);

      expect(handlers.onSubmit).not.toHaveBeenCalled();
    });
  });
});
