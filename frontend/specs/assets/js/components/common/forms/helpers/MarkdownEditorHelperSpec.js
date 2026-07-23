import { renderToStaticMarkup } from 'react-dom/server';
import MarkdownEditorHelper
  from '../../../../../../../assets/js/components/common/forms/helpers/MarkdownEditorHelper.jsx';

describe('MarkdownEditorHelper', function() {
  const buildState = (overrides = {}) => ({
    activeTab: 'write',
    ...overrides,
  });

  const buildHandlers = (overrides = {}) => ({
    onChange: jasmine.createSpy('onChange'),
    onTabChange: jasmine.createSpy('onTabChange'),
    onToolbarAction: jasmine.createSpy('onToolbarAction'),
    textareaRef: { current: null },
    ...overrides,
  });

  describe('.render', function() {
    it('renders a label linked to the textarea via id/htmlFor', function() {
      const html = renderToStaticMarkup(
        MarkdownEditorHelper.render('description', 'Description', '', [], buildState(), buildHandlers()),
      );

      expect(html).toContain('id="description"');
      expect(html).toContain('for="description"');
      expect(html).toContain('Description');
    });

    it('wraps the field in the standard mb-3 spacing class', function() {
      const html = renderToStaticMarkup(
        MarkdownEditorHelper.render('description', 'Description', '', [], buildState(), buildHandlers()),
      );

      expect(html).toContain('class="mb-3"');
    });

    it('renders the Write/Preview tabs', function() {
      const html = renderToStaticMarkup(
        MarkdownEditorHelper.render('description', 'Description', '', [], buildState(), buildHandlers()),
      );

      expect(html).toContain('Write');
      expect(html).toContain('Preview');
    });

    describe('when the active tab is write', function() {
      it('renders the toolbar and the textarea with the given value', function() {
        const html = renderToStaticMarkup(
          MarkdownEditorHelper.render(
            'description', 'Description', 'Some **bold** text.', [], buildState({ activeTab: 'write' }), buildHandlers(),
          ),
        );

        expect(html).toContain('<textarea');
        expect(html).toContain('Some **bold** text.');
        expect(html).toContain('bi-type-bold');
        expect(html).toContain('bi-type-italic');
        expect(html).toContain('bi-type-h1');
        expect(html).toContain('bi-list-ul');
        expect(html).toContain('bi-list-ol');
        expect(html).toContain('bi-link-45deg');
      });

      it('does not render a Markdown preview', function() {
        const html = renderToStaticMarkup(
          MarkdownEditorHelper.render(
            'description', 'Description', '# Heading', [], buildState({ activeTab: 'write' }), buildHandlers(),
          ),
        );

        expect(html).not.toContain('<h1');
      });
    });

    describe('when the active tab is preview', function() {
      it('renders the value as Markdown instead of a textarea', function() {
        const html = renderToStaticMarkup(
          MarkdownEditorHelper.render(
            'description', 'Description', '# Heading', [], buildState({ activeTab: 'preview' }), buildHandlers(),
          ),
        );

        expect(html).not.toContain('<textarea');
        expect(html).toContain('<h1');
        expect(html).toContain('Heading');
      });

      it('renders the empty-preview message when value is blank', function() {
        const html = renderToStaticMarkup(
          MarkdownEditorHelper.render(
            'description', 'Description', '', [], buildState({ activeTab: 'preview' }), buildHandlers(),
          ),
        );

        expect(html).toContain('Nothing to preview yet');
      });
    });

    it('renders one alert per message when errors are provided', function() {
      const html = renderToStaticMarkup(
        MarkdownEditorHelper.render(
          'description', 'Description', '', ['cannot be blank', 'is too short'], buildState(), buildHandlers(),
        ),
      );

      expect(html.match(/alert-danger/g).length).toBe(2);
      expect(html).toContain('cannot be blank');
      expect(html).toContain('is too short');
    });

    it('invokes onTabChange with the target tab when a tab button is clicked', function() {
      const handlers = buildHandlers();
      const element = MarkdownEditorHelper.render('description', 'Description', '', [], buildState(), handlers);
      const tabsRow = element.props.children[1].props.children[0];
      const [writeButton, previewButton] = tabsRow.props.children;

      writeButton.props.onClick();
      expect(handlers.onTabChange).toHaveBeenCalledWith('write');

      previewButton.props.onClick();
      expect(handlers.onTabChange).toHaveBeenCalledWith('preview');
    });

    it('invokes onToolbarAction with the action name when a toolbar button is clicked', function() {
      const handlers = buildHandlers();
      const element = MarkdownEditorHelper.render('description', 'Description', '', [], buildState(), handlers);
      const [, writeContent] = element.props.children[1].props.children;
      const toolbar = writeContent.props.children[0];
      const boldButton = toolbar.props.children[0];

      boldButton.props.onClick();

      expect(handlers.onToolbarAction).toHaveBeenCalledWith('bold');
    });

    it('wires the textarea onChange to handlers.onChange', function() {
      const handlers = buildHandlers();
      const element = MarkdownEditorHelper.render('description', 'Description', 'x', [], buildState(), handlers);
      const [, writeContent] = element.props.children[1].props.children;
      const textarea = writeContent.props.children[1];

      expect(textarea.props.onChange).toBe(handlers.onChange);
    });

    it('wires the textarea ref to handlers.textareaRef', function() {
      const handlers = buildHandlers();
      const element = MarkdownEditorHelper.render('description', 'Description', 'x', [], buildState(), handlers);
      const [, writeContent] = element.props.children[1].props.children;
      const textarea = writeContent.props.children[1];

      expect(textarea.props.ref).toBe(handlers.textareaRef);
    });
  });
});
