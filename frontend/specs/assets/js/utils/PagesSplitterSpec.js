import PagesSplitter from '../../../../assets/js/utils/PagesSplitter.js';

const MODULE_PATH = '../../../../assets/js/utils/PagesSplitter.js';

/**
 * @description Imports a fresh copy of the `PagesSplitter` module, forcing Node to re-evaluate
 *   its top-level module code (and thus re-read the current
 *   `VITE_DOCUMENT_PAGE_WARNING_THRESHOLD`) instead of returning an already-cached module.
 * @returns {Promise<number>} The freshly-loaded `PAGE_WARNING_THRESHOLD` value.
 */
async function freshPageWarningThreshold() {
  // MODULE_PATH is a fixed local constant; only the cache-busting query string (?spec=...) is
  // dynamic, and it never comes from external/user input.
  // eslint-disable-next-line no-unsanitized/method
  const loaded = await import(`${MODULE_PATH}?spec=${Date.now()}-${Math.random()}`);
  return loaded.PAGE_WARNING_THRESHOLD;
}

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

  describe('PAGE_WARNING_THRESHOLD', function() {
    const originalThreshold = process.env.VITE_DOCUMENT_PAGE_WARNING_THRESHOLD;

    afterEach(function() {
      if (originalThreshold === undefined) {
        delete process.env.VITE_DOCUMENT_PAGE_WARNING_THRESHOLD;
      } else {
        process.env.VITE_DOCUMENT_PAGE_WARNING_THRESHOLD = originalThreshold;
      }
    });

    it('defaults to 10 when the env var is unset', async function() {
      delete process.env.VITE_DOCUMENT_PAGE_WARNING_THRESHOLD;

      expect(await freshPageWarningThreshold()).toBe(10);
    });

    it('defaults to 10 when the env var is empty', async function() {
      process.env.VITE_DOCUMENT_PAGE_WARNING_THRESHOLD = '';

      expect(await freshPageWarningThreshold()).toBe(10);
    });

    it('defaults to 10 when the env var is not a valid number', async function() {
      process.env.VITE_DOCUMENT_PAGE_WARNING_THRESHOLD = 'not-a-number';

      expect(await freshPageWarningThreshold()).toBe(10);
    });

    it('honors a stubbed override', async function() {
      process.env.VITE_DOCUMENT_PAGE_WARNING_THRESHOLD = '5';

      expect(await freshPageWarningThreshold()).toBe(5);
    });
  });
});
