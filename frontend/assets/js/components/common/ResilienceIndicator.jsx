import { useEffect, useState } from 'react';
import ResilienceIndicatorController from './controllers/ResilienceIndicatorController.js';
import ResilienceIndicatorHelper from './helpers/ResilienceIndicatorHelper.jsx';
import ResilienceEvents from '../../utils/logging/ResilienceEvents.js';

/**
 * Renders the header's resilience status indicator (idle/requesting/retrying),
 * reflecting whether any resilient HTTP request is currently in flight or
 * being retried after a transient failure. Visible to every user.
 *
 * @returns {React.ReactElement} resilience indicator element.
 */
export default function ResilienceIndicator() {
  const [status, setStatus] = useState(() => new ResilienceIndicatorController().getStatus());

  const controller = new ResilienceIndicatorController(setStatus);

  useEffect(() => {
    const handleChange = () => controller.handleChange();

    ResilienceEvents.subscribe(handleChange);

    return () => {
      ResilienceEvents.unsubscribe(handleChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return ResilienceIndicatorHelper.render({ status });
}
