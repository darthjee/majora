import { useEffect, useMemo, useRef, useState } from 'react';
import StaffCrawlerController from './controllers/StaffCrawlerController.js';
import StaffCrawlerHelper from './helpers/StaffCrawlerHelper.jsx';

// Small tolerance (px) for sub-pixel scroll rounding when deciding whether the feed is
// currently scrolled to the bottom.
const SCROLL_BOTTOM_TOLERANCE_PX = 4;

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
    if (!isAtBottomRef.current || !feedRef.current) {
      return;
    }

    feedRef.current.scrollTop = feedRef.current.scrollHeight;
  }, [emissions.length]);

  const handleScroll = () => {
    const feed = feedRef.current;

    if (!feed) {
      return;
    }

    const distanceFromBottom = feed.scrollHeight - feed.scrollTop - feed.clientHeight;

    isAtBottomRef.current = distanceFromBottom <= SCROLL_BOTTOM_TOLERANCE_PX;
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
