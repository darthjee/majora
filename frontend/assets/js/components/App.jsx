import { useEffect, useMemo, useState } from 'react';
import AppController from './AppController.js';

/**
 * Root application component.
 *
 * @returns {React.ReactElement} Rendered application.
 */
export default function App() {
  const [page, setPage] = useState('home');
  const [hash, setHash] = useState(() => (typeof window === 'undefined' ? '' : window.location.hash));

  const controller = useMemo(() => {
    const defaultTarget = {
      addEventListener: () => {},
      removeEventListener: () => {},
    };

    const eventTarget = typeof window === 'undefined' ? defaultTarget : window;
    const hashProvider = () => (typeof window === 'undefined' ? '' : window.location.hash);

    return new AppController(setPage, eventTarget, hashProvider, setHash);
  }, []);

  useEffect(() => {
    setPage(controller.getPage());
    const effect = controller.buildEffect();
    return effect();
  }, [controller]);

  return controller.renderPage(page, hash);
}
