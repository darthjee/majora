# Verify the chunk split and document the test setup

Run `docker-compose run --rm majora_fe yarn build`, and check that the output lists a separate JS chunk containing Recharts and the charts (not the main `index-*.js` entry) and that the main bundle size didn't grow by Recharts' weight. Mention the chunk name and size in the PR description.

Update the "Recharts conventions" section of the shared-infrastructure spec to match what was built: the `StaffStatisticsCharts` wrapper as the single lazy entry (replacing the per-page `React.lazy` wording), the `charts_loading` fallback string, and whether the `ResizeObserver` stub was needed (with its helper registration) or not.

## Files to Change
- `docs/agents/specs/access-statistics/shared-infrastructure.md`: "Recharts conventions" updated to the built wrapper, the fallback string and the stub outcome
