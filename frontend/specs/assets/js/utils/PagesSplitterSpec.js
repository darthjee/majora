import PagesSplitter from '../../../../assets/js/utils/PagesSplitter.js';

describe('PagesSplitter', function() {
  describe('.split', function() {
    it('returns an empty array for empty content', function() {
      expect(PagesSplitter.split('')).toEqual([]);
    });

    it('returns an empty array for blank (whitespace-only) content', function() {
      expect(PagesSplitter.split('   \n  ')).toEqual([]);
    });

    it('returns a single page when content fits within the budget', function() {
      expect(PagesSplitter.split('Short content.', 100)).toEqual(['Short content.']);
    });

    it('reconstructs the original content exactly when the pages are concatenated back', function() {
      const content = `${'a'.repeat(40)}\n${'b'.repeat(40)}\n${'c'.repeat(40)}`;

      const pages = PagesSplitter.split(content, 50);

      expect(pages.join('')).toBe(content);
      expect(pages.length).toBeGreaterThan(1);
    });

    it('cuts at the nearest preceding line break before the budget mark', function() {
      const content = `${'a'.repeat(10)}\n${'b'.repeat(10)}`;

      const pages = PagesSplitter.split(content, 15);

      expect(pages[0]).toBe(`${'a'.repeat(10)}\n`);
      expect(pages[1]).toBe('b'.repeat(10));
    });

    it('falls back to the nearest preceding space when no line break exists before the mark', function() {
      const content = `${'a'.repeat(10)} ${'b'.repeat(10)}`;

      const pages = PagesSplitter.split(content, 15);

      expect(pages[0]).toBe(`${'a'.repeat(10)} `);
      expect(pages[1]).toBe('b'.repeat(10));
    });

    it('cuts exactly at the budget mark when neither a line break nor a space exists before it', function() {
      const content = 'a'.repeat(30);

      const pages = PagesSplitter.split(content, 15);

      expect(pages[0]).toBe('a'.repeat(15));
      expect(pages[1]).toBe('a'.repeat(15));
    });

    it('nudges the cut to the closer fence boundary instead of splitting an open code fence', function() {
      const before = 'x'.repeat(5);
      const fenceContent = 'y'.repeat(20);
      const after = 'z'.repeat(30);
      const content = `${before}\n\`\`\`\n${fenceContent}\n\`\`\`\n${after}`;
      // Budget mark lands inside the fence body — nudging should snap to whichever fence
      // boundary (open/close) is closer, never leaving an odd number of ``` before the cut.
      const budget = content.indexOf(fenceContent) + 10;

      const pages = PagesSplitter.split(content, budget);

      const fencesInFirstPage = pages[0].split('```').length - 1;

      expect(fencesInFirstPage % 2).toBe(0);
      expect(pages.join('')).toBe(content);
    });

    it('leaves an unterminated fence alone (nothing more it can do)', function() {
      const content = `${'a'.repeat(5)}\n\`\`\`\n${'b'.repeat(30)}`;

      const pages = PagesSplitter.split(content, 12);

      expect(pages.join('')).toBe(content);
    });

    it('does not special-case list/blockquote boundaries', function() {
      const content = `- item one\n${'x'.repeat(20)}\n- item two`;

      const pages = PagesSplitter.split(content, 15);

      expect(pages.join('')).toBe(content);
      expect(pages.length).toBeGreaterThan(1);
    });

    it('exposes the default character budget', function() {
      expect(PagesSplitter.BUDGET).toBeGreaterThan(0);
    });
  });
});
