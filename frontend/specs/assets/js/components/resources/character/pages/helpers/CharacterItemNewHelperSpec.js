import { renderToStaticMarkup } from 'react-dom/server';
import CharacterItemNewHelper
  from '../../../../../../../../assets/js/components/resources/character/pages/helpers/CharacterItemNewHelper.jsx';

describe('CharacterItemNewHelper', function() {
  const buildHandlers = () => ({
    onSubmit: jasmine.createSpy('onSubmit'),
    onNameChange: jasmine.createSpy('onNameChange'),
    onDescriptionChange: jasmine.createSpy('onDescriptionChange'),
    onHiddenChange: jasmine.createSpy('onHiddenChange'),
  });

  const buildState = (overrides = {}) => ({
    name: 'Sword',
    description: 'A sharp blade.',
    hidden: false,
    status: 'idle',
    fieldErrors: {},
    ...overrides,
  });

  describe('.render', function() {
    it('renders all expected form fields', function() {
      const html = renderToStaticMarkup(CharacterItemNewHelper.render(buildState(), buildHandlers()));

      expect(html).toContain('id="item-new-name"');
      expect(html).toContain('id="item-new-description"');
      expect(html).toContain('id="item-new-hidden"');
    });

    it('renders the current field values', function() {
      const html = renderToStaticMarkup(CharacterItemNewHelper.render(buildState(), buildHandlers()));

      expect(html).toContain('value="Sword"');
      expect(html).toContain('A sharp blade.');
    });

    it('renders the hidden checkbox as checked when hidden is true', function() {
      const html = renderToStaticMarkup(
        CharacterItemNewHelper.render(buildState({ hidden: true }), buildHandlers()),
      );

      expect(html).toContain('checked=""');
    });

    it('renders the hidden switch as a bootstrap switch', function() {
      const html = renderToStaticMarkup(CharacterItemNewHelper.render(buildState(), buildHandlers()));
      const hiddenIndex = html.indexOf('id="item-new-hidden"');

      expect(hiddenIndex).toBeGreaterThan(-1);
      expect(html).toContain('form-switch');
      expect(html.lastIndexOf('role="switch"', hiddenIndex + 200)).toBeGreaterThan(-1);
    });

    it('renders the submit button', function() {
      const html = renderToStaticMarkup(CharacterItemNewHelper.render(buildState(), buildHandlers()));

      expect(html).toContain('type="submit"');
    });

    it('disables the submit button while submitting', function() {
      const html = renderToStaticMarkup(
        CharacterItemNewHelper.render(buildState({ status: 'submitting' }), buildHandlers()),
      );

      expect(html).toContain('disabled=""');
    });

    it('does not disable the submit button when status is idle', function() {
      const html = renderToStaticMarkup(CharacterItemNewHelper.render(buildState(), buildHandlers()));

      expect(html).not.toContain('disabled=""');
    });

    it('renders per-field errors when present', function() {
      const html = renderToStaticMarkup(
        CharacterItemNewHelper.render(
          buildState({ fieldErrors: { name: ['is required'] } }),
          buildHandlers(),
        ),
      );

      expect(html).toContain('is required');
      expect(html).toContain('alert-danger');
    });

    it('renders no field error alerts when none are present', function() {
      const html = renderToStaticMarkup(CharacterItemNewHelper.render(buildState(), buildHandlers()));

      expect(html).not.toContain('alert-danger');
    });

    it('renders a general error alert when status is error', function() {
      const html = renderToStaticMarkup(
        CharacterItemNewHelper.render(buildState({ status: 'error' }), buildHandlers()),
      );

      expect(html).toContain('alert');
    });

    it('does not render a general error alert when status is idle', function() {
      const html = renderToStaticMarkup(CharacterItemNewHelper.render(buildState(), buildHandlers()));

      expect(html).not.toContain('alert-danger');
    });
  });
});
