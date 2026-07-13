import { renderToStaticMarkup } from 'react-dom/server';
import StaffUserEditHelper from '../../../../../../../../assets/js/components/resources/staff_user/pages/helpers/StaffUserEditHelper.jsx';

describe('StaffUserEditHelper', function() {
  const buildFormState = (overrides = {}) => ({
    name: 'Jane',
    email: 'jane@example.com',
    status: 'idle',
    fieldErrors: {},
    ...overrides,
  });
  const buildHandlers = () => ({
    onSubmit: jasmine.createSpy('onSubmit'),
    onNameChange: jasmine.createSpy('onNameChange'),
    onEmailChange: jasmine.createSpy('onEmailChange'),
  });

  describe('.render', function() {
    it('renders the form fields with current values', function() {
      const html = renderToStaticMarkup(
        StaffUserEditHelper.render(buildFormState(), buildHandlers())
      );

      expect(html).toContain('value="Jane"');
      expect(html).toContain('value="jane@example.com"');
    });

    it('renders the submit button', function() {
      const html = renderToStaticMarkup(
        StaffUserEditHelper.render(buildFormState(), buildHandlers())
      );

      expect(html).toContain('Save changes');
    });

    it('disables the submit button while submitting', function() {
      const html = renderToStaticMarkup(
        StaffUserEditHelper.render(buildFormState({ status: 'submitting' }), buildHandlers())
      );

      expect(html).toContain('disabled');
    });

    it('renders field errors when present', function() {
      const html = renderToStaticMarkup(
        StaffUserEditHelper.render(
          buildFormState({ fieldErrors: { email: ['is already taken'] } }), buildHandlers()
        )
      );

      expect(html).toContain('is already taken');
    });

    it('renders no error alert when status is not error', function() {
      const html = renderToStaticMarkup(
        StaffUserEditHelper.render(buildFormState(), buildHandlers())
      );

      expect(html).not.toContain('Failed to save user. Please try again.');
    });

    it('renders an error alert when status is error', function() {
      const html = renderToStaticMarkup(
        StaffUserEditHelper.render(buildFormState({ status: 'error' }), buildHandlers())
      );

      expect(html).toContain('Failed to save user. Please try again.');
    });
  });

  describe('.renderLoading', function() {
    it('renders the loading message', function() {
      const html = renderToStaticMarkup(StaffUserEditHelper.renderLoading());
      expect(html).toContain('Loading user...');
    });
  });
});
