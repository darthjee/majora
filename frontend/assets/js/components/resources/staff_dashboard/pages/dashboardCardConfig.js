import MemoryCacheCard from './elements/MemoryCacheCard.jsx';
import DiskCacheCard from './elements/DiskCacheCard.jsx';
import CrawlerDebugCard from './elements/CrawlerDebugCard.jsx';
import VisitsSummaryCard from './elements/VisitsSummaryCard.jsx';

/**
 * Local configuration listing which dashboard card components to render on
 * `/#/staff/dashboard`, in order — not sourced from an endpoint.
 */
export default [
  { key: 'memory_cache', Component: MemoryCacheCard },
  { key: 'disk_cache', Component: DiskCacheCard },
  { key: 'crawler_debug', Component: CrawlerDebugCard },
  { key: 'visits_summary', Component: VisitsSummaryCard },
];
