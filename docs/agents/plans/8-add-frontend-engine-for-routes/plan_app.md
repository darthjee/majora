# Plan: App Shell

## `frontend/assets/js/components/AppController.js`

Identical to the Oak version. Wraps `HashRouteResolver`, listens to `hashchange`, and
delegates rendering to `AppHelper`.

```js
import AppHelper from './helpers/AppHelper.jsx';
import HashRouteResolver from '../utils/HashRouteResolver.js';

export default class AppController {
  constructor(
    setPage,
    eventTarget = window,
    locationProvider = () => window.location.hash,
    setHash = null,
  ) {
    this.setPage = setPage;
    this.eventTarget = eventTarget;
    this.routeResolver = new HashRouteResolver(locationProvider);
    this.setHash = setHash;
  }

  getPage()                { return this.routeResolver.getPage(); }
  renderPage(page, hash = '') { return AppHelper.render(page, hash); }

  buildEffect() {
    return () => {
      const handleHashChange = () => {
        this.setPage(this.getPage());
        this.setHash?.(this.routeResolver.currentHash());
      };
      this.eventTarget.addEventListener('hashchange', handleHashChange);
      return () => this.eventTarget.removeEventListener('hashchange', handleHashChange);
    };
  }
}
```

---

## `frontend/assets/js/components/helpers/AppHelper.jsx`

Maps page identifier strings to stub React page components. `key={hash}` on the
fragment forces React to remount the page component on every hash change.

```jsx
import React from 'react';
import Header from '../elements/Header.jsx';
import Games from '../pages/Games.jsx';
import Game from '../pages/Game.jsx';
import GamePcs from '../pages/GamePcs.jsx';
import GameNpcs from '../pages/GameNpcs.jsx';
import Character from '../pages/Character.jsx';

const PAGES = {
  games:    <Games />,
  game:     <Game />,
  gamePcs:  <GamePcs />,
  gameNpcs: <GameNpcs />,
  character: <Character />,
  home:     <Games />,
};

export default class AppHelper {
  static render(page, hash = '') {
    return (
      <>
        <Header />
        <React.Fragment key={hash}>
          {PAGES[page]}
        </React.Fragment>
      </>
    );
  }
}
```

---

## `frontend/assets/js/App.jsx` (rewrite)

Replace the static placeholder with the AppController-driven routing pattern, identical
to Oak's `App.jsx`.

```jsx
import { useState, useEffect, useMemo } from 'react';
import AppController from './AppController.js';

export default function App() {
  const [page, setPage] = useState(() => new AppController(null).getPage());
  const [hash, setHash] = useState(
    () => (typeof window === 'undefined' ? '' : window.location.hash),
  );

  const controller = useMemo(
    () => new AppController(setPage, window, () => window.location.hash, setHash),
    [],
  );

  useEffect(() => {
    const effect = controller.buildEffect();
    return effect();
  }, [controller]);

  return controller.renderPage(page, hash);
}
```

---

## `frontend/assets/js/main.jsx` (update)

Remove `@tanstack/react-query` — it is unused now that data fetching is handled by
`GenericClient` inside page controllers.

```jsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import '../../assets/css/styles.css';

export function createAppElement() {
  return (
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

export function renderApplication(container) {
  const root = createRoot(container);
  root.render(createAppElement());
  return root;
}

const container = globalThis.document?.getElementById('root');
if (container) renderApplication(container);
```
