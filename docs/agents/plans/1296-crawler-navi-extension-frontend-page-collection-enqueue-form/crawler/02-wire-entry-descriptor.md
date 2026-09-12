# Wire the entry.js descriptor

Extend the existing default-export array in `entry.js` with the new page,
without touching the existing hello-page entry.

```js
import HelloPage from './HelloPage.jsx';
import EnqueuePage from './EnqueuePage.jsx';

export default [
  { path: '/ext/loot/hello', text: 'Loot Hello', component: HelloPage },
  { path: '/ext/lootstudios/enqueue', text: 'Loot Enqueue', component: EnqueuePage },
];
```

`path`/`text` values are fixed by the issue's clarifying-question answer
(`/ext/lootstudios/enqueue`, mirroring the backend route's prefix) — do not
reuse the hello page's `/ext/loot/...` prefix for this entry.

## Files to Change

- `crawler/navi-extension/src/frontend/entry.js` — add the `EnqueuePage`
  import and its descriptor object to the exported array.
