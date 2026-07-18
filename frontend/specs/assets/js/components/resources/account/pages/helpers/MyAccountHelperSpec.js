import { renderToStaticMarkup } from 'react-dom/server';
import MyAccountHelper from '../../../../../../../../assets/js/components/resources/account/pages/helpers/MyAccountHelper.jsx';

describe('MyAccountHelper', function() {
  const buildFormState = (overrides = {}) => ({
    name: 'Jane',
    displayName: 'Jane D',
    email: 'jane@example.com',
    avatarUrl: null,
    password: '',
    passwordConfirmation: '',
    status: 'idle',
    fieldErrors: {},
    ...overrides,
  });
  const buildHandlers = () => ({
    onSubmit: jasmine.createSpy('onSubmit'),
    onNameChange: jasmine.createSpy('onNameChange'),
    onDisplayNameChange: jasmine.createSpy('onDisplayNameChange'),
    onEmailChange: jasmine.createSpy('onEmailChange'),
    onPasswordChange: jasmine.createSpy('onPasswordChange'),
    onPasswordConfirmationChange: jasmine.createSpy('onPasswordConfirmationChange'),
  });

  describe('.render', function() {
    it('renders the form fields with current values', function() {
      const html = renderToStaticMarkup(
        MyAccountHelper.render(buildFormState(), buildHandlers())
      );

      expect(html).toContain('value="Jane"');
      expect(html).toContain('value="Jane D"');
      expect(html).toContain('value="jane@example.com"');
    });

    it('renders the avatar with the given avatarUrl', function() {
      const html = renderToStaticMarkup(
        MyAccountHelper.render(
          buildFormState({ avatarUrl: 'http://example.com/avatar.png' }), buildHandlers()
        )
      );

      expect(html).toContain('http://example.com/avatar.png');
    });

    it('renders the default avatar photo when avatarUrl is null', function() {
      const html = renderToStaticMarkup(
        MyAccountHelper.render(buildFormState({ avatarUrl: null }), buildHandlers())
      );

      expect(html).toContain('default_avatar.png');
    });

    it('renders the submit button', function() {
      const html = renderToStaticMarkup(
        MyAccountHelper.render(buildFormState(), buildHandlers())
      );

      expect(html).toContain('Save changes');
    });

    it('disables the submit button while submitting', function() {
      const html = renderToStaticMarkup(
        MyAccountHelper.render(buildFormState({ status: 'submitting' }), buildHandlers())
      );

      expect(html).toContain('disabled');
    });

    it('renders field errors when present', function() {
      const html = renderToStaticMarkup(
        MyAccountHelper.render(
          buildFormState({ fieldErrors: { email: ['is already taken'] } }), buildHandlers()
        )
      );

      expect(html).toContain('is already taken');
    });

    it('renders display name field errors when present', function() {
      const html = renderToStaticMarkup(
        MyAccountHelper.render(
          buildFormState({ fieldErrors: { display_name: ['is already taken'] } }), buildHandlers()
        )
      );

      expect(html).toContain('is already taken');
    });

    it('renders password confirmation field errors when present', function() {
      const html = renderToStaticMarkup(
        MyAccountHelper.render(
          buildFormState({ fieldErrors: { password_confirmation: ['does not match'] } }),
          buildHandlers()
        )
      );

      expect(html).toContain('does not match');
    });

    it('renders no error alert when status is not error', function() {
      const html = renderToStaticMarkup(
        MyAccountHelper.render(buildFormState(), buildHandlers())
      );

      expect(html).not.toContain('Failed to save account. Please try again.');
    });

    it('renders an error alert when status is error', function() {
      const html = renderToStaticMarkup(
        MyAccountHelper.render(buildFormState({ status: 'error' }), buildHandlers())
      );

      expect(html).toContain('Failed to save account. Please try again.');
    });
  });

  describe('.renderLoading', function() {
    it('renders the loading message', function() {
      const html = renderToStaticMarkup(MyAccountHelper.renderLoading());
      expect(html).toContain('Loading account...');
    });
  });
});
