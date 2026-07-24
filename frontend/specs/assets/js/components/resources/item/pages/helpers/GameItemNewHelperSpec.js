import { renderToStaticMarkup } from 'react-dom/server';
import GameItemNewHelper
  from '../../../../../../../../assets/js/components/resources/item/pages/helpers/GameItemNewHelper.jsx';

describe('GameItemNewHelper', function() {
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
      const html = renderToStaticMarkup(GameItemNewHelper.render(buildState(), buildHandlers()));

      expect(html).toContain('id="item-new-name"');
      expect(html).toContain('id="item-new-description"');
      expect(html).toContain('id="item-new-hidden"');
    });

    it('renders the current field values', function() {
      const html = renderToStaticMarkup(GameItemNewHelper.render(buildState(), buildHandlers()));

      expect(html).toContain('value="Sword"');
      expect(html).toContain('A sharp blade.');
    });

    it('renders the hidden checkbox as checked when hidden is true', function() {
      const html = renderToStaticMarkup(
        GameItemNewHelper.render(buildState({ hidden: true }), buildHandlers()),
      );

      expect(html).toContain('checked=""');
    });

    it('renders the submit button', function() {
      const html = renderToStaticMarkup(GameItemNewHelper.render(buildState(), buildHandlers()));

      expect(html).toContain('type="submit"');
    });

    it('disables the submit button while submitting', function() {
      const html = renderToStaticMarkup(
        GameItemNewHelper.render(buildState({ status: 'submitting' }), buildHandlers()),
      );

      expect(html).toContain('disabled=""');
    });

    it('renders per-field errors when present', function() {
      const html = renderToStaticMarkup(
        GameItemNewHelper.render(
          buildState({ fieldErrors: { name: ['is required'] } }),
          buildHandlers(),
        ),
      );

      expect(html).toContain('is required');
      expect(html).toContain('alert-danger');
    });

    it('renders a general error alert when status is error', function() {
      const html = renderToStaticMarkup(
        GameItemNewHelper.render(buildState({ status: 'error' }), buildHandlers()),
      );

      expect(html).toContain('alert');
    });
  });
});
