import { useEffect, useMemo, useState } from 'react';
import AppController from './AppController.js';
import Translator from '../i18n/Translator.js';
import Noop from '../utils/Noop.js';
import getCurrentHash from '../utils/routing/currentHash.js';

/**
 * Root application component.
 *
 * @returns {React.ReactElement} Rendered application.
 */
export default function App() {
  const [page, setPage] = useState('home');
  const [hash, setHash] = useState(getCurrentHash);
  const [lang, setLang] = useState(() => Translator.getLanguage());

  const controller = useMemo(() => {
    const defaultTarget = {
      addEventListener: Noop.noop,
      removeEventListener: Noop.noop,
    };

    const eventTarget = typeof window === 'undefined' ? defaultTarget : window;

    return new AppController(setPage, eventTarget, getCurrentHash, setHash, setLang);
  }, []);

  useEffect(() => {
    setPage(controller.getPage());
    const effect = controller.buildEffect();
    return effect();
  }, [controller]);

  return controller.renderPage(page, hash, lang);
}
