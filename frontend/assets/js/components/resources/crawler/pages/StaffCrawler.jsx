import { useEffect, useMemo, useRef, useState } from 'react';
import StaffCrawlerController from './controllers/StaffCrawlerController.js';
import StaffCrawlerHelper from './helpers/StaffCrawlerHelper.jsx';

// Small tolerance (px) for sub-pixel scroll rounding when deciding whether the feed is
// currently scrolled to the bottom.
const SCROLL_BOTTOM_TOLERANCE_PX = 4;

/**
 * Determine whether a scrollable feed element is currently scrolled to (or within a small
 * tolerance of) its bottom edge. Kept as a standalone pure function, separate from the
 * `onScroll` wiring, so the "pause auto-scroll while scrolled up" decision is directly
 * unit-testable without a real DOM.
 *
 * @param {{scrollTop: number, scrollHeight: number, clientHeight: number}|null} feed - The
 *   scrollable feed element (or a DOM-shaped stub), or `null` when not yet mounted.
 * @param {number} [tolerancePx] - Sub-pixel scroll rounding tolerance, in pixels.
 * @returns {boolean} `true` when `feed` is `null` (nothing to measure yet, default to
 *   "at bottom") or within `tolerancePx` of its bottom edge.
 */
export function isScrolledToBottom(feed, tolerancePx = SCROLL_BOTTOM_TOLERANCE_PX) {
  if (!feed) {
    return true;
  }

  const distanceFromBottom = feed.scrollHeight - feed.scrollTop - feed.clientHeight;

  return distanceFromBottom <= tolerancePx;
}

/**
 * Scroll a feed element down to its bottom edge, used to auto-follow newly-appended emissions.
 * No-ops when `feed` isn't mounted yet. Kept as a standalone pure function alongside
 * {@link isScrolledToBottom}, for the same testability reason.
 *
 * @param {{scrollTop: number, scrollHeight: number}|null} feed - The scrollable feed element (or
 *   a DOM-shaped stub), or `null` when not yet mounted.
 * @returns {void}
 */
export function scrollFeedToBottom(feed) {
  if (!feed) {
    return;
  }

  feed.scrollTop = feed.scrollHeight;
}

/**
 * Render the staff crawler two-column debug page (issue #1274): a live-updating feed of raw
 * crawler emissions on the left (auto-scrolling to the bottom as new records arrive, unless the
 * user has scrolled up to read older ones), and the selected emission's full JSON payload on the
 * right.
 *
 * @returns {React.ReactElement} Staff crawler page.
 */
export default function StaffCrawler() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [emissions, setEmissions] = useState([]);
  const [selectedId, setSelectedId] = useState(null);

  const feedRef = useRef(null);
  const isAtBottomRef = useRef(true);

  const controller = useMemo(
    () => new StaffCrawlerController(setLoading, setError, setEmissions, setSelectedId),
    [],
  );

  useEffect(() => controller.buildEffect()(), [controller]);

  useEffect(() => {
    if (isAtBottomRef.current) {
      scrollFeedToBottom(feedRef.current);
    }
  }, [emissions.length]);

  const handleScroll = () => {
    isAtBottomRef.current = isScrolledToBottom(feedRef.current);
  };

  if (loading) return StaffCrawlerHelper.renderLoading();
  if (error) return StaffCrawlerHelper.renderError(error);

  return StaffCrawlerHelper.render(
    emissions,
    selectedId,
    (id) => controller.selectEmission(id),
    { feedRef, onScroll: handleScroll },
  );
}
