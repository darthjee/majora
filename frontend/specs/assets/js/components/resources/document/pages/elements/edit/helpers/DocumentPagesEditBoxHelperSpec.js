import { renderToStaticMarkup } from 'react-dom/server';
import DocumentPagesEditBoxHelper
  from '../../../../../../../../../../assets/js/components/resources/document/pages/elements/edit/helpers/DocumentPagesEditBoxHelper.jsx';
import PagesSplitter from '../../../../../../../../../../assets/js/utils/PagesSplitter.js';

describe('DocumentPagesEditBoxHelper', function() {
  const buildHandlers = () => ({
    onEdit: jasmine.createSpy('onEdit'),
    onCancel: jasmine.createSpy('onCancel'),
    onChange: jasmine.createSpy('onChange'),
  });

  describe('.render', function() {
    it('returns null when not in edit mode and the caller cannot edit', function() {
      const state = { editMode: false, loading: false, value: '' };

      expect(DocumentPagesEditBoxHelper.render(state, false, buildHandlers())).toBeNull();
    });

    it('renders the "Edit" affordance when not in edit mode and the caller can edit', function() {
      const state = { editMode: false, loading: false, value: '' };
      const handlers = buildHandlers();
      const html = renderToStaticMarkup(DocumentPagesEditBoxHelper.render(state, true, handlers));

      expect(html).toContain('Edit pages');
    });

    it('wires the "Edit" affordance to onEdit', function() {
      const state = { editMode: false, loading: false, value: '' };
      const handlers = buildHandlers();
      const element = DocumentPagesEditBoxHelper.render(state, true, handlers);

      expect(element.props.children.props.onClick).toBe(handlers.onEdit);
    });

    it('disables the "Edit" affordance while loading', function() {
      const state = { editMode: false, loading: true, value: '' };
      const element = DocumentPagesEditBoxHelper.render(state, true, buildHandlers());

      expect(element.props.children.props.disabled).toBe(true);
    });

    it('renders the full editor (MarkdownEditor, page count, Cancel) once in edit mode', function() {
      const state = { editMode: true, loading: false, value: 'Some content.' };
      const handlers = buildHandlers();
      const html = renderToStaticMarkup(DocumentPagesEditBoxHelper.render(state, true, handlers));

      expect(html).toContain('Some content.');
      expect(html).toContain('Cancel');
      expect(html).toContain('1 pages');
    });

    it('wires the Cancel button to onCancel', function() {
      const state = { editMode: true, loading: false, value: '' };
      const handlers = buildHandlers();
      const element = DocumentPagesEditBoxHelper.render(state, true, handlers);
      const [, , cancelButton] = element.props.children;

      expect(cancelButton.props.onClick).toBe(handlers.onCancel);
    });

    it('renders the editor even when canEditPages is false, once edit mode is already active', function() {
      const state = { editMode: true, loading: false, value: '' };
      const html = renderToStaticMarkup(DocumentPagesEditBoxHelper.render(state, false, buildHandlers()));

      expect(html).toContain('Cancel');
    });

    it('computes the live page count as a blind content-length/budget estimate', function() {
      const value = 'a'.repeat(PagesSplitter.BUDGET + 1);
      const state = { editMode: true, loading: false, value };
      const html = renderToStaticMarkup(DocumentPagesEditBoxHelper.render(state, true, buildHandlers()));

      expect(html).toContain('2 pages');
    });

    it('shows a page count of 0 for blank content', function() {
      const state = { editMode: true, loading: false, value: '   ' };
      const html = renderToStaticMarkup(DocumentPagesEditBoxHelper.render(state, true, buildHandlers()));

      expect(html).toContain('0 pages');
    });
  });
});
