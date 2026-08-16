const FENCE = '```';

/**
 * Pure, save-time text-to-pages splitter for `DocumentPagesEditBox` (issue #1129). Cuts a single
 * Markdown blob into a fixed character-per-page budget, snapping the cut point backward to avoid
 * breaking inline Markdown or fenced code blocks — see the issue's "Split-boundary safety" section
 * for the exact priority order this mirrors:
 *
 * 1. From the budget-character mark, scan backward to the nearest preceding line break.
 * 2. If none exists before the mark, fall back to the nearest preceding space instead.
 * 3. If the resulting cut lands inside an open ` ``` ` fence (an odd count of fence markers
 *    before it), nudge it to whichever fence boundary — the opening or the closing marker — is
 *    closer to the original budget-character mark, so a page never ends mid-fence.
 * 4. Lists/blockquotes are not special-cased (splitting across them still renders as valid
 *    Markdown), and a single paragraph/fenced block bigger than the whole budget falls back to
 *    cutting exactly at the budget mark — both are accepted "nothing more we can do" cases.
 *
 * Kept a plain, stateless text-in/page-array-out function (no DOM/React dependency), mirroring
 * how `DocumentPagesBoxController.resolveMostVisiblePage` is kept pure for the same testability
 * reason. The live "total pages" counter shown while editing does **not** use this — it stays a
 * blind `content.length / budget` estimate on purpose (see the issue's own note), reusing only
 * {@link PagesSplitter.BUDGET} for consistency.
 */
export default class PagesSplitter {
  /**
   * Character-per-page budget used both by the actual save-time split and (for consistency) by
   * the live "total pages" blind estimate shown while editing. No pre-existing length convention
   * exists anywhere else in the codebase to reuse (see the issue's "Editing approach" section) —
   * this is a planning-time decision.
   *
   * @type {number}
   */
  static BUDGET = 4000;

  /**
   * Split `content` into an ordered array of page contents, each at most `budget` characters
   * (barring the pathological "nothing more we can do" cases described above). Concatenating the
   * returned array back together always reconstructs `content` exactly — every cut point is a
   * plain slice boundary, nothing is trimmed or inserted.
   *
   * @param {string} content - The full document text to split.
   * @param {number} [budget] - Character-per-page budget. Defaults to {@link PagesSplitter.BUDGET}.
   * @returns {string[]} Ordered page contents. Empty when `content` is empty/blank.
   */
  static split(content, budget = PagesSplitter.BUDGET) {
    const text = typeof content === 'string' ? content : '';

    if (text.trim().length === 0) {
      return [];
    }

    const pages = [];
    let remaining = text;

    while (remaining.length > budget) {
      const cut = PagesSplitter.#resolveCut(remaining, budget);

      pages.push(remaining.slice(0, cut));
      remaining = remaining.slice(cut);
    }

    pages.push(remaining);

    return pages;
  }

  static #resolveCut(text, budget) {
    const candidate = PagesSplitter.#snapToBoundary(text, budget);

    return PagesSplitter.#avoidOpenFence(text, candidate, budget);
  }

  static #snapToBoundary(text, budget) {
    const lineBreak = text.lastIndexOf('\n', budget);

    if (lineBreak > 0) {
      return lineBreak + 1;
    }

    const space = text.lastIndexOf(' ', budget);

    return space > 0 ? space + 1 : budget;
  }

  static #avoidOpenFence(text, cut, target) {
    const fencesBefore = PagesSplitter.#countFences(text.slice(0, cut));

    if (fencesBefore % 2 === 0) {
      return cut;
    }

    const openIndex = text.lastIndexOf(FENCE, cut);
    const closeIndex = text.indexOf(FENCE, cut);

    if (closeIndex === -1) {
      return cut;
    }

    const closeBoundary = closeIndex + FENCE.length;
    const openDistance = Math.abs(target - openIndex);
    const closeDistance = Math.abs(closeBoundary - target);

    return closeDistance <= openDistance ? closeBoundary : openIndex;
  }

  static #countFences(text) {
    return text.split(FENCE).length - 1;
  }
}
