import MarkdownSyntax from '../../../../assets/js/utils/MarkdownSyntax.js';

describe('MarkdownSyntax', function() {
  describe('.apply', function() {
    describe('bold', function() {
      it('wraps the selected text in **', function() {
        const result = MarkdownSyntax.apply('bold', 'Hello world', 6, 11);

        expect(result.value).toBe('Hello **world**');
        expect(result.selectionStart).toBe(8);
        expect(result.selectionEnd).toBe(13);
      });

      it('inserts an empty pair and places the cursor between them when nothing is selected', function() {
        const result = MarkdownSyntax.apply('bold', 'Hello ', 6, 6);

        expect(result.value).toBe('Hello ****');
        expect(result.selectionStart).toBe(8);
        expect(result.selectionEnd).toBe(8);
      });
    });

    describe('italic', function() {
      it('wraps the selected text in *', function() {
        const result = MarkdownSyntax.apply('italic', 'Hello world', 6, 11);

        expect(result.value).toBe('Hello *world*');
        expect(result.selectionStart).toBe(7);
        expect(result.selectionEnd).toBe(12);
      });

      it('inserts an empty pair and places the cursor between them when nothing is selected', function() {
        const result = MarkdownSyntax.apply('italic', '', 0, 0);

        expect(result.value).toBe('**');
        expect(result.selectionStart).toBe(1);
        expect(result.selectionEnd).toBe(1);
      });
    });

    describe('heading', function() {
      it('prefixes the current line with "## "', function() {
        const result = MarkdownSyntax.apply('heading', 'Title', 2, 2);

        expect(result.value).toBe('## Title');
        expect(result.selectionStart).toBe(5);
        expect(result.selectionEnd).toBe(5);
      });

      it('prefixes the line the cursor is on, not the first line', function() {
        const result = MarkdownSyntax.apply('heading', 'Line one\nLine two', 12, 12);

        expect(result.value).toBe('Line one\n## Line two');
        expect(result.selectionStart).toBe(15);
        expect(result.selectionEnd).toBe(15);
      });
    });

    describe('bulleted_list', function() {
      it('prefixes the current line with "- "', function() {
        const result = MarkdownSyntax.apply('bulleted_list', 'Item', 0, 0);

        expect(result.value).toBe('- Item');
        expect(result.selectionStart).toBe(2);
        expect(result.selectionEnd).toBe(2);
      });
    });

    describe('numbered_list', function() {
      it('prefixes the current line with "1. "', function() {
        const result = MarkdownSyntax.apply('numbered_list', 'Item', 0, 0);

        expect(result.value).toBe('1. Item');
        expect(result.selectionStart).toBe(3);
        expect(result.selectionEnd).toBe(3);
      });
    });

    describe('link', function() {
      it('wraps the selection as [selection](url)', function() {
        const result = MarkdownSyntax.apply('link', 'Check this out', 6, 10);

        expect(result.value).toBe('Check [this](url) out');
        expect(result.selectionStart).toBe(13);
        expect(result.selectionEnd).toBe(16);
      });

      it('inserts a [link](url) placeholder when nothing is selected', function() {
        const result = MarkdownSyntax.apply('link', '', 0, 0);

        expect(result.value).toBe('[link](url)');
        expect(result.selectionStart).toBe(7);
        expect(result.selectionEnd).toBe(10);
      });
    });

    describe('an unrecognized action', function() {
      it('returns the value and selection unchanged', function() {
        const result = MarkdownSyntax.apply('unknown', 'Hello', 1, 3);

        expect(result.value).toBe('Hello');
        expect(result.selectionStart).toBe(1);
        expect(result.selectionEnd).toBe(3);
      });
    });
  });
});
