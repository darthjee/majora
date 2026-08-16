import { useEffect, useMemo, useRef, useState } from 'react';
import DocumentPagesBoxController from './controllers/DocumentPagesBoxController.js';
import DocumentPagesBoxHelper from './helpers/DocumentPagesBoxHelper.jsx';

const INITIAL_STATE = {
  segments: [], loadedPages: new Set(), totalPages: 0, currentPage: 1,
};

/**
 * Observe a bottom sentinel element, invoking `onIntersect` whenever it scrolls into `root`'s
 * view — the "load the next page" trigger. No-ops (and cleans up nothing) when `root`/`target`
 * aren't mounted yet, or in environments with no `IntersectionObserver` (e.g. server rendering),
 * mirroring how `DescriptionBox`'s own `useLayoutEffect` no-ops without a real `boxRef.current`.
 *
 * @param {Element} root - The scrolling container `target` is observed relative to.
 * @param {Element} target - The bottom sentinel element.
 * @param {Function} onIntersect - Invoked whenever `target` becomes visible inside `root`.
 * @returns {Function|undefined} Cleanup disconnecting the observer, or `undefined` when nothing
 *   was set up.
 */
function observeBottomSentinel(root, target, onIntersect) {
  if (!root || !target || typeof IntersectionObserver === 'undefined') {
    return undefined;
  }

  const observer = new IntersectionObserver((entries) => {
    if (entries.some((entry) => entry.isIntersecting)) {
      onIntersect();
    }
  }, { root });

  observer.observe(target);

  return () => observer.disconnect();
}

/**
 * Observe every currently-rendered segment element, invoking `onEntries` with the raw
 * `IntersectionObserver` entries on every visibility change — resolving which loaded page is
 * most visible (see `DocumentPagesBoxController.resolveMostVisiblePage`) is left to the caller,
 * keeping this wiring function a thin, DOM-only concern.
 *
 * @param {Element} root - The scrolling container each segment is observed relative to.
 * @param {Map<number, Element>} segmentElements - Segment elements keyed by their own page
 *   number, as populated by `DocumentPagesBox`'s `registerSegmentRef`.
 * @param {Function} onEntries - Invoked with the observer's own entries on every visibility
 *   change.
 * @returns {Function|undefined} Cleanup disconnecting the observer, or `undefined` when nothing
 *   was set up.
 */
function observeSegments(root, segmentElements, onEntries) {
  if (!root || segmentElements.size === 0 || typeof IntersectionObserver === 'undefined') {
    return undefined;
  }

  const observer = new IntersectionObserver(
    (entries) => onEntries(entries),
    { root, threshold: [0, 0.25, 0.5, 0.75, 1] },
  );

  segmentElements.forEach((element) => observer.observe(element));

  return () => observer.disconnect();
}

/**
 * Self-fetching bottom-slot box on the game document detail page (issue #1126): reads a
 * `GameDocument`'s own `GameDocumentPage`s one page at a time, combining click-through pagination
 * (reusing `Pagination` — every hash change, including a page-link click, remounts this component
 * from scratch, so `DocumentPagesBoxController#loadInitial` re-reading the hash is all a click
 * needs) with scroll-triggered auto-load-and-append via two `IntersectionObserver`s: one on a
 * bottom sentinel (loads and appends the next page), one on every rendered segment (updates the
 * pagination indicator to the most-visible loaded page, without ever re-fetching).
 *
 * @param {object} props - Component props, the page's merged `ShowPageLayout` rendering context
 *   spread in.
 * @param {string} props.game_slug - Game slug, used to fetch pages and build pagination links.
 * @param {number|string} props.id - `GameDocument` id, used to fetch pages and build pagination
 *   links.
 * @param {boolean} [props.canEditPages] - Whether the current user may edit this document's
 *   pages (issue #1129), gating the box's own "Edit pages" entry point. Resource-agnostic: the
 *   caller resolves this the same way it resolves `GameDocument.jsx`'s own `canUploadPhoto`
 *   (`AccessStore.ensureGameAccess`) — this component never fetches its own permissions.
 * @returns {React.ReactElement|null} The pages box element, or `null` while no page is loaded and
 *   the caller cannot edit.
 */
export default function DocumentPagesBox({ game_slug: gameSlug, id, canEditPages = false }) {
  const [state, setState] = useState(INITIAL_STATE);
  const boxRef = useRef(null);
  const bottomSentinelRef = useRef(null);
  const segmentElements = useRef(new Map());

  const controller = useMemo(() => new DocumentPagesBoxController(gameSlug, id), [gameSlug, id]);

  const registerSegmentRef = (page, element) => {
    if (element) {
      segmentElements.current.set(page, element);
    } else {
      segmentElements.current.delete(page);
    }
  };

  useEffect(() => {
    let mounted = true;

    controller.loadInitial().then((next) => {
      if (mounted) setState(next);
    });

    return () => {
      mounted = false;
    };
  }, [controller]);

  useEffect(
    () => observeBottomSentinel(boxRef.current, bottomSentinelRef.current, () => {
      controller.loadNext(state).then(setState);
    }),
    [controller, state],
  );

  useEffect(
    () => observeSegments(boxRef.current, segmentElements.current, (entries) => {
      setState((previous) => {
        const nextPage = DocumentPagesBoxController.resolveMostVisiblePage(entries, previous.currentPage);

        return nextPage === previous.currentPage ? previous : { ...previous, currentPage: nextPage };
      });
    }),
    [state.segments],
  );

  return DocumentPagesBoxHelper.render(
    state, { boxRef, bottomSentinelRef, registerSegmentRef }, gameSlug, id, canEditPages,
  );
}
