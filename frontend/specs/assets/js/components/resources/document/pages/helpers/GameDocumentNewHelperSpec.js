import { renderToStaticMarkup } from 'react-dom/server';
import GameDocumentNewHelper
  from '../../../../../../../../assets/js/components/resources/document/pages/helpers/GameDocumentNewHelper.jsx';

describe('GameDocumentNewHelper', function() {
  const buildHandlers = () => ({
    onSubmit: jasmine.createSpy('onSubmit'),
    onNameChange: jasmine.createSpy('onNameChange'),
    onDescriptionChange: jasmine.createSpy('onDescriptionChange'),
    onHiddenChange: jasmine.createSpy('onHiddenChange'),
  });

  const buildState = (overrides = {}) => ({
    name: 'Ancient Scroll',
    description: 'A crumbling scroll.',
    hidden: false,
    status: 'idle',
    fieldErrors: {},
    ...overrides,
  });

  describe('.render', function() {
    it('renders all expected form fields', function() {
      const html = renderToStaticMarkup(GameDocumentNewHelper.render(buildState(), buildHandlers()));

      expect(html).toContain('id="document-new-name"');
      expect(html).toContain('id="document-new-description"');
      expect(html).toContain('id="document-new-hidden"');
    });

    it('renders the current field values', function() {
      const html = renderToStaticMarkup(GameDocumentNewHelper.render(buildState(), buildHandlers()));

      expect(html).toContain('value="Ancient Scroll"');
      expect(html).toContain('A crumbling scroll.');
    });

    it('renders the hidden checkbox as checked when hidden is true', function() {
      const html = renderToStaticMarkup(
        GameDocumentNewHelper.render(buildState({ hidden: true }), buildHandlers()),
      );

      expect(html).toContain('checked=""');
    });

    it('renders the submit button', function() {
      const html = renderToStaticMarkup(GameDocumentNewHelper.render(buildState(), buildHandlers()));

      expect(html).toContain('type="submit"');
    });

    it('disables the submit button while submitting', function() {
      const html = renderToStaticMarkup(
        GameDocumentNewHelper.render(buildState({ status: 'submitting' }), buildHandlers()),
      );

      expect(html).toContain('disabled=""');
    });

    it('renders per-field errors when present', function() {
      const html = renderToStaticMarkup(
        GameDocumentNewHelper.render(
          buildState({ fieldErrors: { name: ['is required'] } }),
          buildHandlers(),
        ),
      );

      expect(html).toContain('is required');
      expect(html).toContain('alert-danger');
    });

    it('renders a general error alert when status is error', function() {
      const html = renderToStaticMarkup(
        GameDocumentNewHelper.render(buildState({ status: 'error' }), buildHandlers()),
      );

      expect(html).toContain('alert');
    });
  });
});
