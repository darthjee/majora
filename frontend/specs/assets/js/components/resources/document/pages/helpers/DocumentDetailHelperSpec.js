import { renderToStaticMarkup } from 'react-dom/server';
import DocumentDetailHelper
  from '../../../../../../../../assets/js/components/resources/document/pages/helpers/DocumentDetailHelper.jsx';

/**
 * Extracts the `UploadButton` element rendered as the third `pageActions` entry (the
 * file-upload button, after the Give Document and Edit buttons), by unwrapping its
 * `ConditionalComponent` wrapper.
 *
 * @param {React.ReactElement} element - The `ShowPageLayout` element returned by `.render`.
 * @returns {React.ReactElement} The file-upload `UploadButton` element.
 */
function findFileUploadButton(element) {
  const [, , fileUploadWrapper] = element.props.pageActions.props.children;

  return fileUploadWrapper.props.children;
}

/**
 * Extracts the "Give Document" button element rendered as the first `pageActions` entry, by
 * unwrapping its `ConditionalComponent` wrapper.
 *
 * @param {React.ReactElement} element - The `ShowPageLayout` element returned by `.render`.
 * @returns {React.ReactElement} The "Give Document" button element.
 */
function findGiveDocumentButton(element) {
  const [giveDocumentWrapper] = element.props.pageActions.props.children;

  return giveDocumentWrapper.props.children;
}

describe('DocumentDetailHelper', function() {
  describe('.render', function() {
    it('renders the document name', function() {
      const document = { id: 5, name: 'Ancient Scroll', description: 'A crumbling scroll.' };
      const html = renderToStaticMarkup(DocumentDetailHelper.render(document, '#/games/demo/documents'));

      expect(html).toContain('Ancient Scroll');
    });

    it('renders the document description', function() {
      const document = { id: 5, name: 'Ancient Scroll', description: 'A crumbling scroll.' };
      const html = renderToStaticMarkup(DocumentDetailHelper.render(document, '#/games/demo/documents'));

      expect(html).toContain('A crumbling scroll.');
    });

    it('renders the description inside the collapsible description box', function() {
      const document = { id: 5, name: 'Ancient Scroll', description: 'A crumbling scroll.' };
      const html = renderToStaticMarkup(DocumentDetailHelper.render(document, '#/games/demo/documents'));

      expect(html).toContain('border rounded bg-light');
    });

    it('renders the document photo', function() {
      const document = {
        id: 5, name: 'Ancient Scroll', description: 'A crumbling scroll.', photo_path: '/document.png',
      };
      const html = renderToStaticMarkup(DocumentDetailHelper.render(document, '#/games/demo/documents'));

      expect(html).toContain('/document.png');
    });

    it('renders a back button to the given href', function() {
      const document = { id: 5, name: 'Ancient Scroll', description: '' };
      const html = renderToStaticMarkup(DocumentDetailHelper.render(document, '#/games/demo/documents'));

      expect(html).toContain('href="#/games/demo/documents"');
    });

    it('renders the hidden badge when the document is hidden', function() {
      const document = {
        id: 5, name: 'Ancient Scroll', description: '', hidden: true,
      };
      const html = renderToStaticMarkup(DocumentDetailHelper.render(document, '#/games/demo/documents'));

      expect(html).toContain('bi-eye-slash-fill');
    });

    it('does not render the hidden badge when the document is not hidden', function() {
      const document = { id: 5, name: 'Ancient Scroll', description: '' };
      const html = renderToStaticMarkup(DocumentDetailHelper.render(document, '#/games/demo/documents'));

      expect(html).not.toContain('bi-eye-slash-fill');
    });

    it('does not render the upload button when canUploadPhoto is omitted', function() {
      const document = { id: 5, name: 'Ancient Scroll', description: '' };
      const html = renderToStaticMarkup(
        DocumentDetailHelper.render(document, '#/games/demo/documents', '#/games/demo/documents/5/edit'),
      );

      expect(html).not.toContain('actions-overlay-button');
    });

    it('renders the upload button when canUploadPhoto is true', function() {
      const document = { id: 5, name: 'Ancient Scroll', description: '' };
      const html = renderToStaticMarkup(
        DocumentDetailHelper.render(document, '#/games/demo/documents', '#/games/demo/documents/5/edit', true),
      );

      expect(html).toContain('actions-overlay-button');
    });

    it('passes canUploadPhoto and onUploadClick through to the show page layout context', function() {
      const document = { id: 5, name: 'Ancient Scroll', description: '' };
      const onUploadClick = jasmine.createSpy('onUploadClick');
      const element = DocumentDetailHelper.render(
        document, '#/games/demo/documents', '#/games/demo/documents/5/edit', true, onUploadClick,
      );

      expect(element.props.context.canUploadPhoto).toBe(true);
      expect(element.props.context.handlers.onOpenUploadModal).toBe(onUploadClick);
    });

    it('threads canUploadPhoto through as canEditPages (issue #1129) — no separate general edit permission', function() {
      const document = { id: 5, name: 'Ancient Scroll', description: '' };
      const element = DocumentDetailHelper.render(
        document, '#/games/demo/documents', '#/games/demo/documents/5/edit', true,
      );

      expect(element.props.context.canEditPages).toBe(true);
    });

    it('threads canEditPages as false when canUploadPhoto is omitted', function() {
      const document = { id: 5, name: 'Ancient Scroll', description: '' };
      const element = DocumentDetailHelper.render(document, '#/games/demo/documents', '#/games/demo/documents/5/edit');

      expect(element.props.context.canEditPages).toBe(false);
    });

    it('passes gameSlug through to the show page layout context as game_slug (issue #873)', function() {
      const document = { id: 5, name: 'Ancient Scroll', description: '' };
      const element = DocumentDetailHelper.render(
        document, '#/games/demo/documents', '#/games/demo/documents/5/edit', true, undefined, undefined, 'demo',
      );

      expect(element.props.context.game_slug).toBe('demo');
      expect(element.props.context.id).toBe(5);
    });

    it('passes onSelectPhoto through to the show page layout context handlers (issue #873)', function() {
      const document = { id: 5, name: 'Ancient Scroll', description: '' };
      const onSelectPhoto = jasmine.createSpy('onSelectPhoto');
      const element = DocumentDetailHelper.render(
        document, '#/games/demo/documents', '#/games/demo/documents/5/edit', true,
        undefined, undefined, 'demo', onSelectPhoto,
      );

      expect(element.props.context.handlers.onSelectPhoto).toBe(onSelectPhoto);
    });

    it('defaults onSelectPhoto to a no-op', function() {
      const document = { id: 5, name: 'Ancient Scroll', description: '' };
      const element = DocumentDetailHelper.render(document, '#/games/demo/documents');

      expect(() => element.props.context.handlers.onSelectPhoto()).not.toThrow();
    });

    it('does not render the edit button when canUploadPhoto is omitted', function() {
      const document = { id: 5, name: 'Ancient Scroll', description: '' };
      const html = renderToStaticMarkup(
        DocumentDetailHelper.render(document, '#/games/demo/documents', '#/games/demo/documents/5/edit'),
      );

      expect(html).not.toContain('href="#/games/demo/documents/5/edit"');
    });

    it('does not render the edit button when canUploadPhoto is false', function() {
      const document = { id: 5, name: 'Ancient Scroll', description: '' };
      const html = renderToStaticMarkup(
        DocumentDetailHelper.render(document, '#/games/demo/documents', '#/games/demo/documents/5/edit', false),
      );

      expect(html).not.toContain('href="#/games/demo/documents/5/edit"');
    });

    it('renders the edit button linking to editHref when canUploadPhoto is true', function() {
      const document = { id: 5, name: 'Ancient Scroll', description: '' };
      const html = renderToStaticMarkup(
        DocumentDetailHelper.render(document, '#/games/demo/documents', '#/games/demo/documents/5/edit', true),
      );

      expect(html).toContain('href="#/games/demo/documents/5/edit"');
    });

    describe('give document button (issue #1005)', function() {
      it('does not render the give document button when canUploadPhoto is omitted', function() {
        const document = { id: 5, name: 'Ancient Scroll', description: '' };
        const html = renderToStaticMarkup(
          DocumentDetailHelper.render(document, '#/games/demo/documents', '#/games/demo/documents/5/edit'),
        );

        expect(html).not.toContain('Give Document');
      });

      it('does not render the give document button when canUploadPhoto is false', function() {
        const document = { id: 5, name: 'Ancient Scroll', description: '' };
        const html = renderToStaticMarkup(
          DocumentDetailHelper.render(document, '#/games/demo/documents', '#/games/demo/documents/5/edit', false),
        );

        expect(html).not.toContain('Give Document');
      });

      it('renders the give document button when canUploadPhoto is true', function() {
        const document = { id: 5, name: 'Ancient Scroll', description: '' };
        const html = renderToStaticMarkup(
          DocumentDetailHelper.render(document, '#/games/demo/documents', '#/games/demo/documents/5/edit', true),
        );

        expect(html).toContain('Give Document');
      });

      it('wires the given onGiveDocumentClick handler to the give document button', function() {
        const document = { id: 5, name: 'Ancient Scroll', description: '' };
        const onGiveDocumentClick = jasmine.createSpy('onGiveDocumentClick');
        const element = DocumentDetailHelper.render(
          document, '#/games/demo/documents', '#/games/demo/documents/5/edit', true,
          undefined, undefined, undefined, undefined, onGiveDocumentClick,
        );
        const button = findGiveDocumentButton(element);

        button.props.onClick();

        expect(onGiveDocumentClick).toHaveBeenCalled();
      });
    });

    describe('file upload button (issue #726)', function() {
      it('does not render the file upload button when canUploadPhoto is omitted', function() {
        const document = { id: 5, name: 'Ancient Scroll', description: '' };
        const html = renderToStaticMarkup(
          DocumentDetailHelper.render(document, '#/games/demo/documents', '#/games/demo/documents/5/edit'),
        );

        expect(html).not.toContain('bi-file-earmark-pdf-fill');
      });

      it('does not render the file upload button when canUploadPhoto is false', function() {
        const document = { id: 5, name: 'Ancient Scroll', description: '' };
        const html = renderToStaticMarkup(
          DocumentDetailHelper.render(document, '#/games/demo/documents', '#/games/demo/documents/5/edit', false),
        );

        expect(html).not.toContain('bi-file-earmark-pdf-fill');
      });

      it('renders the file upload button when canUploadPhoto is true', function() {
        const document = { id: 5, name: 'Ancient Scroll', description: '' };
        const html = renderToStaticMarkup(
          DocumentDetailHelper.render(document, '#/games/demo/documents', '#/games/demo/documents/5/edit', true),
        );

        expect(html).toContain('bi-file-earmark-pdf-fill');
      });

      it('wires the given onFileUploadClick handler to the file upload button', function() {
        const document = { id: 5, name: 'Ancient Scroll', description: '' };
        const onUploadClick = jasmine.createSpy('onUploadClick');
        const onFileUploadClick = jasmine.createSpy('onFileUploadClick');
        const element = DocumentDetailHelper.render(
          document, '#/games/demo/documents', '#/games/demo/documents/5/edit', true,
          onUploadClick, onFileUploadClick,
        );
        const button = findFileUploadButton(element);

        button.props.onClick();

        expect(onFileUploadClick).toHaveBeenCalled();
      });
    });
  });

  describe('.renderLoading', function() {
    it('renders the loading message', function() {
      const html = renderToStaticMarkup(DocumentDetailHelper.renderLoading());
      expect(html).toContain('Loading document...');
    });
  });

  describe('.renderError', function() {
    it('renders the error message', function() {
      const html = renderToStaticMarkup(DocumentDetailHelper.renderError('boom'));
      expect(html).toContain('boom');
    });
  });
});
