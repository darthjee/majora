# Write the frontend charts doc

Create `docs/agents/frontend/charts.md` with the **generic** Recharts conventions, so
future charts reuse the pattern. The sources are the "Charting" and "Recharts conventions"
sections of `specs/access-statistics/shared-infrastructure.md`. Check them against the
shipped code (`#1500`):

- the `recharts` 3.x dependency;
- lazy loading: one chunk re-exported from a `charts/index.js`, loaded with `React.lazy`
  inside `<Suspense fallback={<LoadingMessage />}>`, with only the charts in the lazy chunk;
- sizing: `ResponsiveContainer` with a fluid width, a fixed height, and a
  `data-testid` wrapper;
- per-chart structure: a client, a controller (no JSX) and a pure render helper;
- testing: chart components get smoke tests only, and the logic is tested in the
  controllers and helpers (include any Jasmine setup the implementation needed);
- the color palette and where it lives.

Keep statistics-specific details (which tab draws which chart) in `statistics.md` and link
to them from here.

Add the file to `docs/agents/frontend/index.md` and to the list in `docs/agents/frontend.md`.

## Files to Change

- `docs/agents/frontend/charts.md` — new chart conventions doc.
- `docs/agents/frontend/index.md` — list the new file.
- `docs/agents/frontend.md` — list the new file.
